const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const slugify = require('slugify');

// Load CMS Portal models & helpers
const Category = require('./models/Category');
const Post = require('./models/Post');
const Gallery = require('./models/Gallery');
const Media = require('./models/Media');
const User = require('./models/User');
const { syncToMediaLibrary } = require('./utils/mediaHelper');

const WP_UPLOADS_BASE = '/Volumes/Swapnil/projects/myHot/wp-content/uploads';
const CMS_UPLOADS_BASE = path.join(__dirname, 'uploads');

// Helper to decode HEX back to utf8 string
function fromHex(hex) {
  if (!hex) return '';
  try {
    return Buffer.from(hex, 'hex').toString('utf8');
  } catch (e) {
    return '';
  }
}

// Helper to run MySQL queries inside Docker container and return array of objects
function runMysqlQuery(sql) {
  try {
    const raw = execFileSync(
      'docker',
      ['exec', '-i', 'myhot_db', 'mysql', '-uwp', '-pwp', '-D', 'myhot', '--batch', '--raw', '-e', sql],
      { maxBuffer: 100 * 1024 * 1024, encoding: 'utf8' }
    );
    const lines = raw.trim().split('\n').filter(l => !l.startsWith('mysql:'));
    if (lines.length <= 1) return [];
    const headers = lines[0].split('\t');
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split('\t');
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = parts[idx] !== undefined ? parts[idx] : '';
      });
      rows.push(obj);
    }
    return rows;
  } catch (err) {
    console.error('MySQL query error:', err.message);
    return [];
  }
}

async function main() {
  console.log('🚀 Starting WordPress to CMS Portal Migration (Enhanced With Category Images & Strict Hierarchy)...\n');

  // 1. Connect MongoDB
  await mongoose.connect('mongodb://127.0.0.1:27017/cms_portal');
  console.log('✅ Connected to MongoDB (cms_portal)');

  // 2. Fetch Super Admin User
  const adminUser = await User.findOne({ role: 'admin' }) || await User.findOne({});
  const adminId = adminUser ? adminUser._id : null;
  console.log(`👤 Using Admin user for ownership: ${adminUser ? adminUser.name : 'None'} (${adminId})`);

  // Ensure upload target folders exist
  ['images', 'galleries', 'banners', 'thumbnails'].forEach(dir => {
    const p = path.join(CMS_UPLOADS_BASE, dir);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  });

  // 3. Pre-load all WordPress attachments metadata
  console.log('📦 Loading attachment mappings from WordPress...');
  const attachmentRows = runMysqlQuery(`
    SELECT p.ID, pm.meta_value AS attached_file
    FROM blog_posts p
    JOIN blog_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_wp_attached_file'
    WHERE p.post_type = 'attachment';
  `);
  const attachmentMap = new Map(); // attachment_id -> relative file path (e.g. 2022/01/xxx.jpg)
  for (const r of attachmentRows) {
    attachmentMap.set(String(r.ID), r.attached_file.trim());
  }
  console.log(`✅ Loaded ${attachmentMap.size} attachments from WordPress MySQL`);

  // Helper to copy and register media in CMS Portal
  const mediaCache = new Map(); // srcPath -> { url, mediaId }

  async function copyAndRegisterMedia(wpRelPathOrAttachmentId, targetSubDir = 'images', altText = '') {
    let relPath = '';
    if (attachmentMap.has(String(wpRelPathOrAttachmentId))) {
      relPath = attachmentMap.get(String(wpRelPathOrAttachmentId));
    } else if (typeof wpRelPathOrAttachmentId === 'string') {
      relPath = wpRelPathOrAttachmentId.replace(/^\/+/, '').replace(/^wp-content\/uploads\//, '');
    }

    if (!relPath) return null;
    relPath = relPath.split('?')[0].split('#')[0];

    if (mediaCache.has(relPath)) {
      return mediaCache.get(relPath);
    }

    // Locate source file on disk
    let srcDiskPath = path.join(WP_UPLOADS_BASE, relPath);
    if (!fs.existsSync(srcDiskPath)) {
      const base = path.basename(relPath);
      const possibleMatches = [
        path.join(WP_UPLOADS_BASE, base),
        path.join(WP_UPLOADS_BASE, '2021', '01', base),
        path.join(WP_UPLOADS_BASE, '2022', '01', base),
        path.join(WP_UPLOADS_BASE, '2022', '02', base),
        path.join(WP_UPLOADS_BASE, '2022', '05', base),
        path.join(WP_UPLOADS_BASE, '2022', '07', base),
        path.join(WP_UPLOADS_BASE, '2022', '10', base),
        path.join(WP_UPLOADS_BASE, '2023', '08', base),
        path.join(WP_UPLOADS_BASE, '2023', '09', base),
        path.join(WP_UPLOADS_BASE, '2024', '01', base),
        path.join(WP_UPLOADS_BASE, '2025', '01', base),
        path.join(WP_UPLOADS_BASE, '2026', '01', base),
        path.join(WP_UPLOADS_BASE, '2026', '06', base),
        path.join(WP_UPLOADS_BASE, '2026', '07', base)
      ];
      srcDiskPath = possibleMatches.find(p => fs.existsSync(p)) || null;
    }

    if (!srcDiskPath || !fs.existsSync(srcDiskPath)) {
      return null;
    }

    const fileBase = path.basename(srcDiskPath);
    const destFilename = fileBase.startsWith('wp-') ? fileBase : `wp-${fileBase}`;
    const destDiskPath = path.join(CMS_UPLOADS_BASE, targetSubDir, destFilename);
    const destRelUrl = `/uploads/${targetSubDir}/${destFilename}`;

    // Copy physical file if not already present or smaller
    if (!fs.existsSync(destDiskPath) || fs.statSync(destDiskPath).size === 0) {
      try {
        fs.copyFileSync(srcDiskPath, destDiskPath);
      } catch (err) {
        console.error(`❌ Failed to copy ${srcDiskPath} to ${destDiskPath}:`, err.message);
        return null;
      }
    }

    const fileSize = fs.statSync(destDiskPath).size;
    const ext = path.extname(destFilename).toLowerCase();

    // Register into CMS Portal Media collection via helper
    const mediaDoc = await syncToMediaLibrary({
      filename: destFilename,
      originalName: fileBase,
      extension: ext,
      size: fileSize,
      url: destRelUrl,
      thumbnail: destRelUrl,
      mediaType: 'image',
      uploadedBy: adminId
    });

    if (mediaDoc && altText && !mediaDoc.altText) {
      mediaDoc.altText = altText;
      await mediaDoc.save();
    }

    const result = {
      url: destRelUrl,
      mediaId: mediaDoc ? mediaDoc._id : null
    };
    mediaCache.set(relPath, result);
    return result;
  }

  // 4. Load Category Images from blog_termmeta
  console.log('\n🎨 Loading Category images from WordPress blog_termmeta...');
  const termMetaRows = runMysqlQuery(`
    SELECT term_id, meta_key, meta_value
    FROM blog_termmeta
    WHERE meta_key IN ('thumbnail', 'taxonomy_image') AND meta_value != '';
  `);
  const termImageMap = new Map(); // term_id -> attachment_id
  for (const tm of termMetaRows) {
    termImageMap.set(String(tm.term_id), tm.meta_value.trim());
  }

  // 5. Migrate Categories & Subcategories with Images and Clean Hierarchy
  console.log('\n📂 Migrating Categories & Subcategories...');
  const categoryRows = runMysqlQuery(`
    SELECT t.term_id, t.name, t.slug, tt.taxonomy, tt.parent, t.term_id, tt.description
    FROM blog_terms t
    JOIN blog_term_taxonomy tt ON t.term_id = tt.term_id
    WHERE tt.taxonomy IN ('category', 'gallery')
    ORDER BY tt.parent ASC;
  `);

  const termIdToMongoCat = new Map(); // term_id -> Mongo Category Doc

  for (const row of categoryRows) {
    if (row.name === 'Uncategorized' && row.slug === 'uncategorized') continue;

    const catType = row.taxonomy === 'gallery' ? 'gallery' : 'post';
    const cleanSlug = slugify(row.slug || row.name, { lower: true, strict: true });

    // Sync Category Image if available
    let catImageUrl = '';
    const attId = termImageMap.get(String(row.term_id));
    if (attId) {
      const imgRes = await copyAndRegisterMedia(attId, 'thumbnails', `${row.name} Category Thumbnail`);
      if (imgRes) {
        catImageUrl = imgRes.url;
      }
    }
    // Fallback for Mrs. Shanti not at home
    if (!catImageUrl && cleanSlug === 'mrs-shanti-not-at-home') {
      const shantiFallback = await copyAndRegisterMedia('2023/08/Sajani-Web-Series-Download.jpg', 'thumbnails', 'Mrs. Shanti not at home');
      if (shantiFallback) catImageUrl = shantiFallback.url;
    }

    let cat = await Category.findOne({ slug: cleanSlug });
    if (!cat) {
      cat = await Category.create({
        name: row.name,
        slug: cleanSlug,
        description: row.description || '',
        thumbnail: catImageUrl,
        banner: catImageUrl,
        bannerImage: catImageUrl,
        type: catType,
        isActive: true
      });
      console.log(`   ➕ Created Category: "${row.name}" [Img: ${catImageUrl ? 'YES' : 'NO'}]`);
    } else {
      cat.name = row.name;
      if (catImageUrl) {
        cat.thumbnail = catImageUrl;
        cat.banner = catImageUrl;
        cat.bannerImage = catImageUrl;
      }
      if (cat.type !== 'all' && cat.type !== catType) {
        cat.type = 'all';
      }
      await cat.save();
      console.log(`   🔄 Updated Category: "${row.name}" [Img: ${cat.thumbnail ? 'YES' : 'NO'}]`);
    }
    termIdToMongoCat.set(String(row.term_id), cat);
  }

  // Set Explicit Clean Hierarchy:
  // For Gallery:
  // Make "Desi Bhabi's" a Root category so its children (Tulsi Bhabi, Desi Chut, Preeti) are valid 2nd-level subcategories!
  const desiBhabisCat = await Category.findOne({ slug: 'desi-bhabis' });
  if (desiBhabisCat) {
    desiBhabisCat.parentCategory = null;
    await desiBhabisCat.save();
    console.log('   👑 Promoted "Desi Bhabi\'s" to Root Category for galleries');
  }

  // Link subcategories cleanly
  for (const row of categoryRows) {
    const tid = String(row.term_id);
    const childCat = termIdToMongoCat.get(tid);
    if (!childCat) continue;

    // Custom parent mapping for gallery 3-level collapse to 2-level
    if (['tulsi-bhabi', 'desi-chut', 'preeti-honeymoon-gallery'].includes(childCat.slug)) {
      if (desiBhabisCat) {
        childCat.parentCategory = desiBhabisCat._id;
        await childCat.save();
        console.log(`   🔗 Linked Subcategory "${childCat.name}" -> Parent "Desi Bhabi's"`);
      }
    } else if (childCat.slug === 'uncle') {
      const indianCat = await Category.findOne({ slug: 'indian' });
      if (indianCat) {
        childCat.parentCategory = indianCat._id;
        await childCat.save();
        console.log(`   🔗 Linked Subcategory "${childCat.name}" -> Parent "Indian"`);
      }
    } else if (row.parent && row.parent !== '0') {
      const parentCat = termIdToMongoCat.get(String(row.parent));
      if (parentCat) {
        childCat.parentCategory = parentCat._id;
        await childCat.save();
        console.log(`   🔗 Linked Subcategory "${childCat.name}" -> Parent "${parentCat.name}"`);
      }
    }
  }

  // 6. Pre-load Post Terms (Categories, Tags) from MySQL
  console.log('\n🏷️ Loading Post Taxonomy relations...');
  const postTermsRows = runMysqlQuery(`
    SELECT tr.object_id AS post_id, t.term_id, t.name, t.slug, tt.taxonomy, tt.parent
    FROM blog_term_relationships tr
    JOIN blog_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
    JOIN blog_terms t ON tt.term_id = t.term_id;
  `);

  const postTermsMap = new Map(); // post_id -> { categoryTermIds: [], tags: [] }
  for (const r of postTermsRows) {
    const pid = String(r.post_id);
    if (!postTermsMap.has(pid)) {
      postTermsMap.set(pid, { categoryTermIds: [], tags: [] });
    }
    const entry = postTermsMap.get(pid);
    if (r.taxonomy === 'category' || r.taxonomy === 'gallery') {
      if (r.slug !== 'uncategorized') {
        entry.categoryTermIds.push(String(r.term_id));
      }
    } else if (r.taxonomy === 'tags' || r.taxonomy === 'post_tag') {
      entry.tags.push(r.name);
    }
  }

  // Helper to strictly resolve Root Category & SubCategory
  async function resolveStrictCategories(postId, isGallery = false) {
    const entry = postTermsMap.get(String(postId));
    if (!entry || entry.categoryTermIds.length === 0) {
      return { category: null, subCategory: null, categories: [] };
    }

    const cats = [];
    for (const tid of entry.categoryTermIds) {
      const c = termIdToMongoCat.get(tid);
      if (c) {
        // Reload fresh from DB
        const fresh = await Category.findById(c._id);
        if (fresh) cats.push(fresh);
      }
    }

    let rootCat = null;
    let subCat = null;

    // Check if any matched category is a subcategory (has parentCategory)
    const childFound = cats.find(c => c.parentCategory != null);
    if (childFound) {
      subCat = childFound;
      rootCat = await Category.findById(childFound.parentCategory);
    } else {
      // All matched are root categories
      rootCat = cats.find(c => c.parentCategory == null) || cats[0] || null;
      subCat = null;
    }

    const allCatIds = [rootCat?._id, subCat?._id].filter(Boolean);
    return {
      category: rootCat ? rootCat._id : null,
      subCategory: subCat ? subCat._id : null,
      categories: allCatIds
    };
  }

  // 7. Migrate Standard Posts (post_type = 'post')
  console.log('\n📝 Migrating Standard Posts (post_type = "post")...');
  const standardPosts = runMysqlQuery(`
    SELECT ID, HEX(post_title) AS hex_title, post_name, HEX(post_content) AS hex_content, HEX(post_excerpt) AS hex_excerpt, post_date, post_status
    FROM blog_posts
    WHERE post_type = 'post' AND post_status = 'publish'
    ORDER BY ID ASC;
  `);

  let postsMigrated = 0;
  for (const wpPost of standardPosts) {
    const postPid = String(wpPost.ID);
    const postTitle = fromHex(wpPost.hex_title).trim();
    const postContent = fromHex(wpPost.hex_content);
    const postExcerpt = fromHex(wpPost.hex_excerpt);

    if (!postTitle) continue;

    console.log(`\n➡️ Processing Post ID ${postPid}: "${postTitle}"`);

    // Featured Image
    const thumbRows = runMysqlQuery(`
      SELECT meta_value FROM blog_postmeta WHERE post_id = ${postPid} AND meta_key = '_thumbnail_id' LIMIT 1;
    `);
    let featuredImageUrl = '';
    let bannerMediaId = null;

    if (thumbRows.length > 0 && thumbRows[0].meta_value) {
      const thumbId = thumbRows[0].meta_value.trim();
      const mediaResult = await copyAndRegisterMedia(thumbId, 'images', postTitle);
      if (mediaResult) {
        featuredImageUrl = mediaResult.url;
        bannerMediaId = mediaResult.mediaId;
      }
    }

    // Process Content
    let content = postContent || '';
    const imgRegex = /(?:http:\/\/localhost:8081)?\/wp-content\/uploads\/([a-zA-Z0-9_\-\.\/]+)/g;
    let match;
    const urlsToReplace = new Set();
    while ((match = imgRegex.exec(content)) !== null) {
      urlsToReplace.add(match[1]);
    }

    for (const relImg of urlsToReplace) {
      const localized = await copyAndRegisterMedia(relImg, 'images', postTitle);
      if (localized) {
        content = content.split(`http://localhost:8081/wp-content/uploads/${relImg}`).join(localized.url);
        content = content.split(`/wp-content/uploads/${relImg}`).join(localized.url);
        if (!featuredImageUrl) {
          featuredImageUrl = localized.url;
          bannerMediaId = localized.mediaId;
        }
      }
    }

    // Resolve Strictly
    const { category, subCategory, categories } = await resolveStrictCategories(postPid, false);
    const tags = (postTermsMap.get(postPid)?.tags) || [];
    const cleanSlug = slugify(wpPost.post_name || postTitle, { lower: true, strict: true });

    let existingPost = await Post.findOne({ slug: cleanSlug });
    if (!existingPost) {
      existingPost = new Post({
        title: postTitle,
        slug: cleanSlug,
        excerpt: postExcerpt || '',
        shortDescription: postExcerpt || '',
        content: content,
        featuredImage: featuredImageUrl,
        banner: featuredImageUrl,
        bannerMedia: bannerMediaId,
        category,
        subCategory,
        categories,
        tags,
        status: 'published',
        author: adminId,
        createdAt: new Date(wpPost.post_date || Date.now())
      });
      await existingPost.save();
      console.log(`   ✅ Created Post: "${postTitle}" [Cat: ${category ? 'OK' : 'None'}, Sub: ${subCategory ? 'OK' : 'None'}]`);
    } else {
      existingPost.title = postTitle;
      existingPost.excerpt = postExcerpt || existingPost.excerpt;
      existingPost.shortDescription = postExcerpt || existingPost.shortDescription;
      existingPost.content = content;
      if (featuredImageUrl) {
        existingPost.featuredImage = featuredImageUrl;
        existingPost.banner = featuredImageUrl;
        existingPost.bannerMedia = bannerMediaId;
      }
      existingPost.category = category;
      existingPost.subCategory = subCategory;
      existingPost.categories = categories;
      existingPost.tags = tags;
      existingPost.status = 'published';
      await existingPost.save();
      console.log(`   🔄 Updated Post: "${postTitle}" [Cat: ${category ? 'OK' : 'None'}, Sub: ${subCategory ? 'OK' : 'None'}]`);
    }
    postsMigrated++;
  }

  // 8. Migrate Image Galleries (post_type = 'images')
  console.log('\n🖼️ Migrating Image Galleries (post_type = "images")...');
  const imagePosts = runMysqlQuery(`
    SELECT ID, HEX(post_title) AS hex_title, post_name, HEX(post_content) AS hex_content, HEX(post_excerpt) AS hex_excerpt, post_date, post_status
    FROM blog_posts
    WHERE post_type = 'images' AND post_status = 'publish'
    ORDER BY ID ASC;
  `);

  let galleriesMigrated = 0;
  for (const imgPost of imagePosts) {
    const galPid = String(imgPost.ID);
    const galTitle = fromHex(imgPost.hex_title).trim();
    const galContent = fromHex(imgPost.hex_content);
    const galExcerpt = fromHex(imgPost.hex_excerpt);

    if (!galTitle) continue;

    console.log(`\n➡️ Processing Gallery ID ${galPid}: "${galTitle}"`);

    const metaRows = runMysqlQuery(`
      SELECT meta_key, HEX(meta_value) AS hex_meta_value FROM blog_postmeta
      WHERE post_id = ${galPid} AND meta_key IN (
        '_thumbnail_id', 'gallery_images', 'new_gallery', 'description',
        'after_gallery_content', 'after_second_gallery_content'
      );
    `);
    const postMeta = {};
    for (const m of metaRows) {
      postMeta[m.meta_key] = fromHex(m.hex_meta_value);
    }

    // Cover Image
    let coverImageUrl = '';
    let bannerMediaId = null;
    if (postMeta._thumbnail_id) {
      const coverRes = await copyAndRegisterMedia(postMeta._thumbnail_id.trim(), 'galleries', galTitle);
      if (coverRes) {
        coverImageUrl = coverRes.url;
        bannerMediaId = coverRes.mediaId;
      }
    }

    // Extract Gallery Attachment IDs
    const galleryImageIds = [];
    const extractIds = (rawStr) => {
      if (!rawStr) return;
      const matches = [...rawStr.matchAll(/"(\d+)"/g)].map(m => m[1]);
      matches.forEach(id => {
        if (!galleryImageIds.includes(id)) galleryImageIds.push(id);
      });
    };
    extractIds(postMeta.gallery_images);
    extractIds(postMeta.new_gallery);

    const galleryPhotos = [];
    let photoOrder = 0;
    for (const attId of galleryImageIds) {
      const photoRes = await copyAndRegisterMedia(attId, 'galleries', `${galTitle} photo`);
      if (photoRes) {
        if (!coverImageUrl) {
          coverImageUrl = photoRes.url;
          bannerMediaId = photoRes.mediaId;
        }
        galleryPhotos.push({
          url: photoRes.url,
          title: path.basename(photoRes.url),
          caption: '',
          order: photoOrder++
        });
      }
    }

    // Combine descriptions
    const descParts = [];
    if (postMeta.description) descParts.push(postMeta.description);
    if (postMeta.after_gallery_content) descParts.push(postMeta.after_gallery_content);
    if (postMeta.after_second_gallery_content) descParts.push(postMeta.after_second_gallery_content);
    if (galContent && !descParts.length) descParts.push(galContent);
    const combinedDescription = descParts.join('\n\n');

    // Resolve Category Strictly
    const { category, subCategory, categories } = await resolveStrictCategories(galPid, true);
    const tags = (postTermsMap.get(galPid)?.tags) || [];

    const cleanSlug = slugify(imgPost.post_name || galTitle, { lower: true, strict: true });
    const cleanTitle = galTitle.replace(/<br\s*[\/]?>/gi, ' ');

    let existingGal = await Gallery.findOne({ slug: cleanSlug });
    if (!existingGal) {
      existingGal = new Gallery({
        title: cleanTitle,
        slug: cleanSlug,
        description: combinedDescription,
        shortDescription: galExcerpt || '',
        coverImage: coverImageUrl,
        banner: coverImageUrl,
        bannerMedia: bannerMediaId,
        images: galleryPhotos,
        category,
        subCategory,
        categories,
        tags,
        status: 'published',
        author: adminId,
        createdAt: new Date(imgPost.post_date || Date.now())
      });
      await existingGal.save();
      console.log(`   ✅ Created Gallery: "${cleanTitle}" [Cat: ${category ? 'OK' : 'None'}, Sub: ${subCategory ? 'OK' : 'None'}]`);
    } else {
      existingGal.title = cleanTitle;
      existingGal.description = combinedDescription;
      existingGal.shortDescription = galExcerpt || existingGal.shortDescription;
      if (coverImageUrl) {
        existingGal.coverImage = coverImageUrl;
        existingGal.banner = coverImageUrl;
        existingGal.bannerMedia = bannerMediaId;
      }
      existingGal.images = galleryPhotos;
      existingGal.category = category;
      existingGal.subCategory = subCategory;
      existingGal.categories = categories;
      existingGal.tags = tags;
      existingGal.status = 'published';
      await existingGal.save();
      console.log(`   🔄 Updated Gallery: "${cleanTitle}" [Cat: ${category ? 'OK' : 'None'}, Sub: ${subCategory ? 'OK' : 'None'}]`);
    }
    galleriesMigrated++;
  }

  // 9. Summary
  const totalMediaInDb = await Media.countDocuments({});
  const totalPostsInDb = await Post.countDocuments({});
  const totalGalleriesInDb = await Gallery.countDocuments({});
  const totalCategoriesInDb = await Category.countDocuments({});

  console.log('\n=============================================');
  console.log('🎉 Migration Completed Successfully!');
  console.log('=============================================');
  console.log(`📁 Categories with Images:   ${totalCategoriesInDb}`);
  console.log(`📝 Posts Migrated:           ${postsMigrated} (Total in DB: ${totalPostsInDb})`);
  console.log(`🖼️ Galleries Migrated:       ${galleriesMigrated} (Total in DB: ${totalGalleriesInDb})`);
  console.log(`🎨 Total Media in Library:   ${totalMediaInDb}`);
  console.log('=============================================\n');

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal Migration Error:', err);
  process.exit(1);
});
