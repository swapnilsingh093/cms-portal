const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Models
const Category = require('../models/Category');
const Video = require('../models/Video');
const Media = require('../models/Media');
const User = require('../models/User');

const SQL_FILE = path.resolve(__dirname, '../../../myHot/myhot.sql');
const WP_UPLOADS = path.resolve(__dirname, '../../../myHot/wp-content/uploads');
const LOCAL_UPLOADS = path.resolve(__dirname, '../uploads');

function parseSqlRow(rowStr) {
  let str = rowStr.trim();
  if (str.startsWith('(')) str = str.slice(1);
  if (str.endsWith('),') || str.endsWith(');')) str = str.slice(0, -2);
  else if (str.endsWith(')')) str = str.slice(0, -1);

  const values = [];
  let curr = [];
  let inQuote = false;
  let escape = false;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (escape) {
      curr.push(ch);
      escape = false;
    } else if (ch === '\\') {
      escape = true;
    } else if (ch === "'") {
      inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      values.append ? values.append(curr.join('').trim()) : values.push(curr.join('').trim());
      curr = [];
    } else {
      curr.push(ch);
    }
  }
  if (curr.length > 0) {
    values.push(curr.join('').trim());
  }
  return values;
}

// PHP serialize parser for simple arrays
function parsePhpSerializedArray(str) {
  if (!str) return [];
  const results = [];
  const matches = str.matchAll(/s:\d+:"([^"]+)";/g);
  for (const m of matches) {
    results.push(m[1]);
  }
  return results;
}

async function runMigration() {
  console.log('--- Starting WordPress to CMS Portal Video Migration ---');
  console.log('SQL File:', SQL_FILE);
  console.log('WP Uploads:', WP_UPLOADS);
  console.log('Local Uploads:', LOCAL_UPLOADS);

  if (!fs.existsSync(SQL_FILE)) {
    console.error('SQL dump file not found at:', SQL_FILE);
    process.exit(1);
  }

  // Ensure local directories exist
  ['videos', 'thumbnails', 'images', 'banners'].forEach((d) => {
    const p = path.join(LOCAL_UPLOADS, d);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  });

  // Connect to DB
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
  const dbUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cms_portal';
  await mongoose.connect(dbUri);
  console.log('Connected to MongoDB:', dbUri);

  // Find an admin user to assign uploads/authors
  const adminUser = await User.findOne({ role: 'admin' });
  const adminId = adminUser ? adminUser._id : null;

  console.log('Reading and streaming myhot.sql...');
  const sqlContent = fs.readFileSync(SQL_FILE, 'utf-8');
  const lines = sqlContent.split('\n');

  // 1. Extract terms: (term_id, name, slug, term_group, term_order)
  const terms = {};
  // 2. Extract term_taxonomy: (term_taxonomy_id, term_id, taxonomy, description, parent, count)
  const termTaxonomy = {};
  // 3. Extract term_relationships: (object_id, term_taxonomy_id, term_order)
  const termRelationships = {}; // post_id -> [term_taxonomy_id]
  // 4. Extract postmeta: (meta_id, post_id, meta_key, meta_value)
  const postmeta = {}; // post_id -> { key: value }
  // 5. Extract attachments: post_id -> { title, guid, attached_file }
  const attachments = {};
  // 6. Extract video posts: list of video post objects
  const rawVideos = [];

  let currentTable = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('INSERT INTO `')) {
      const m = line.match(/INSERT INTO `([^`]+)`/);
      currentTable = m ? m[1] : null;
      continue;
    }

    if (!line.trim().startsWith('(')) {
      continue;
    }

    if (currentTable === 'blog_terms') {
      const cols = parseSqlRow(line);
      if (cols.length >= 3) {
        terms[cols[0]] = { name: cols[1], slug: cols[2] };
      }
    } else if (currentTable === 'blog_term_taxonomy') {
      const cols = parseSqlRow(line);
      if (cols.length >= 5) {
        termTaxonomy[cols[0]] = {
          term_taxonomy_id: cols[0],
          term_id: cols[1],
          taxonomy: cols[2],
          parent: cols[4]
        };
      }
    } else if (currentTable === 'blog_term_relationships') {
      const cols = parseSqlRow(line);
      if (cols.length >= 2) {
        const oid = cols[0];
        const ttId = cols[1];
        if (!termRelationships[oid]) termRelationships[oid] = [];
        termRelationships[oid].push(ttId);
      }
    } else if (currentTable === 'blog_postmeta') {
      const cols = parseSqlRow(line);
      if (cols.length >= 4) {
        const pid = cols[1];
        const key = cols[2];
        const val = cols[3];
        if (!postmeta[pid]) postmeta[pid] = {};
        postmeta[pid][key] = val;
      }
    } else if (currentTable === 'blog_posts') {
      // Check if line represents an attachment or video
      if (line.includes("'attachment'") || line.includes("'videos'")) {
        const cols = parseSqlRow(line);
        if (cols.length >= 21) {
          const pid = cols[0];
          const postType = cols[20];
          if (postType === 'attachment') {
            attachments[pid] = {
              id: pid,
              title: cols[5],
              guid: cols[18],
              mimeType: cols[21]
            };
          } else if (postType === 'videos') {
            rawVideos.push({
              id: pid,
              title: cols[5],
              content: cols[4],
              excerpt: cols[6],
              status: cols[7] === 'publish' ? 'published' : cols[7],
              slug: cols[11],
              date: cols[2]
            });
          }
        }
      }
    }
  }

  console.log(`Parsed ${Object.keys(terms).length} terms`);
  console.log(`Parsed ${Object.keys(termTaxonomy).length} term taxonomies`);
  console.log(`Parsed ${Object.keys(attachments).length} attachments`);
  console.log(`Parsed ${rawVideos.length} videos from blog_posts`);

  // Map attachments to attached file paths from postmeta
  for (const [pid, att] of Object.entries(attachments)) {
    if (postmeta[pid] && postmeta[pid]['_wp_attached_file']) {
      att.attachedFile = postmeta[pid]['_wp_attached_file'];
    }
  }

  // --- Step 1: Migrate Video Categories and Hierarchy ---
  console.log('\n--- Syncing Video Categories ---');
  const wpTaxToMongoCategory = {}; // term_taxonomy_id -> Category._id
  const wpTermIdToMongoCategory = {}; // term_id -> Category._id

  // 1A. First pass: Root parent categories (parent == '0')
  for (const [ttId, tt] of Object.entries(termTaxonomy)) {
    if (tt.taxonomy === 'video' && (tt.parent === '0' || tt.parent === 0)) {
      const termInfo = terms[tt.term_id] || { name: 'Video Category', slug: `video-cat-${tt.term_id}` };
      let cat = await Category.findOne({ slug: termInfo.slug, type: 'video' });
      if (!cat) {
        cat = await Category.create({
          name: termInfo.name,
          slug: termInfo.slug,
          type: 'video',
          parentCategory: null
        });
        console.log(`Created Root Category: ${cat.name} (${cat.slug}) [${cat._id}]`);
      } else {
        console.log(`Found Existing Root Category: ${cat.name} (${cat.slug}) [${cat._id}]`);
      }
      wpTaxToMongoCategory[ttId] = cat._id;
      wpTermIdToMongoCategory[tt.term_id] = cat._id;
    }
  }

  // 1B. Second pass: Subcategories (parent != '0')
  for (const [ttId, tt] of Object.entries(termTaxonomy)) {
    if (tt.taxonomy === 'video' && tt.parent !== '0' && tt.parent !== 0) {
      const termInfo = terms[tt.term_id] || { name: 'Sub Category', slug: `sub-cat-${tt.term_id}` };
      const parentMongoId = wpTaxToMongoCategory[tt.parent] || wpTermIdToMongoCategory[tt.parent] || null;

      let subCat = await Category.findOne({ slug: termInfo.slug, type: 'video' });
      if (!subCat) {
        subCat = await Category.create({
          name: termInfo.name,
          slug: termInfo.slug,
          type: 'video',
          parentCategory: parentMongoId
        });
        console.log(`Created Subcategory: ${subCat.name} (${subCat.slug}) -> Parent: ${parentMongoId}`);
      } else {
        if (parentMongoId && (!subCat.parentCategory || String(subCat.parentCategory) !== String(parentMongoId))) {
          subCat.parentCategory = parentMongoId;
          await subCat.save();
        }
        console.log(`Updated Subcategory: ${subCat.name} (${subCat.slug}) -> Parent: ${parentMongoId}`);
      }
      wpTaxToMongoCategory[ttId] = subCat._id;
      wpTermIdToMongoCategory[tt.term_id] = subCat._id;
    }
  }

  // Helper to copy file from WP uploads to local CMS uploads
  const copyFileToLocal = (relPath, destSubdir) => {
    if (!relPath) return null;
    const cleanRel = relPath.replace(/^(\/|uploads\/)/, '');
    const sourcePath = path.join(WP_UPLOADS, cleanRel);
    if (!fs.existsSync(sourcePath)) {
      return null;
    }
    const filename = path.basename(sourcePath);
    const destDir = path.join(LOCAL_UPLOADS, destSubdir);
    const destPath = path.join(destDir, filename);

    if (!fs.existsSync(destPath)) {
      try {
        fs.copyFileSync(sourcePath, destPath);
      } catch (err) {
        console.warn(`Copy error for ${sourcePath}:`, err.message);
        return null;
      }
    }
    return `/uploads/${destSubdir}/${filename}`;
  };

  // --- Step 2: Migrate Videos ---
  console.log(`\n--- Migrating ${rawVideos.length} Videos ---`);
  let createdCount = 0;
  let updatedCount = 0;

  for (const v of rawVideos) {
    const pid = v.id;
    const meta = postmeta[pid] || {};

    // 2A. Extract metadata fields
    let choiceCategories = [];
    if (meta['_video_choice_category']) {
      choiceCategories = parsePhpSerializedArray(meta['_video_choice_category']);
    }

    const ageGroup = meta['_video_age_group'] || '';
    const maritalStatus = meta['_video_marital_status'] || '';
    const views = parseInt(meta['post_views_count']) || 0;

    // 2B. Resolve Video File
    let finalVideoUrl = '';
    const videoLibVal = meta['post_settings_video_library'] || meta['video_library'];
    if (videoLibVal) {
      if (attachments[videoLibVal]) {
        const att = attachments[videoLibVal];
        const localUrl = copyFileToLocal(att.attachedFile, 'videos');
        if (localUrl) finalVideoUrl = localUrl;
        else if (att.guid && att.guid.startsWith('http')) finalVideoUrl = att.guid;
      } else if (typeof videoLibVal === 'string' && videoLibVal.includes('.')) {
        const localUrl = copyFileToLocal(videoLibVal, 'videos');
        if (localUrl) finalVideoUrl = localUrl;
        else if (videoLibVal.startsWith('http')) finalVideoUrl = videoLibVal;
      }
    }

    // 2C. Resolve Poster / Thumbnail Image
    let finalPosterUrl = '';
    const posterVal = meta['post_settings_video_poster'] || meta['video_poster'] || meta['_thumbnail_id'];
    if (posterVal) {
      if (attachments[posterVal]) {
        const att = attachments[posterVal];
        const localUrl = copyFileToLocal(att.attachedFile, 'thumbnails');
        if (localUrl) finalPosterUrl = localUrl;
        else if (att.guid && att.guid.startsWith('http')) finalPosterUrl = att.guid;
      } else if (typeof posterVal === 'string' && posterVal.includes('.')) {
        const localUrl = copyFileToLocal(posterVal, 'thumbnails');
        if (localUrl) finalPosterUrl = localUrl;
        else if (posterVal.startsWith('http')) finalPosterUrl = posterVal;
      }
    }

    // Register Media objects in MongoDB if not already created
    if (finalVideoUrl && finalVideoUrl.startsWith('/uploads/')) {
      const filename = path.basename(finalVideoUrl);
      const filePath = path.join(LOCAL_UPLOADS, 'videos', filename);
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        await Media.findOneAndUpdate(
          { url: finalVideoUrl },
          {
            filename,
            originalName: v.title || filename,
            mimeType: 'video/mp4',
            size: stat.size,
            url: finalVideoUrl,
            mediaType: 'video',
            uploadedBy: adminId
          },
          { upsert: true, new: true }
        );
      }
    }

    if (finalPosterUrl && finalPosterUrl.startsWith('/uploads/')) {
      const filename = path.basename(finalPosterUrl);
      const filePath = path.join(LOCAL_UPLOADS, 'thumbnails', filename);
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        await Media.findOneAndUpdate(
          { url: finalPosterUrl },
          {
            filename,
            originalName: `${v.title || 'poster'}-poster.jpg`,
            mimeType: 'image/jpeg',
            size: stat.size,
            url: finalPosterUrl,
            mediaType: 'image',
            uploadedBy: adminId
          },
          { upsert: true, new: true }
        );
      }
    }

    // 2D. Resolve Categories and Tags
    const postTtIds = termRelationships[pid] || [];
    let parentCategoryMongoId = null;
    let subCategoryMongoId = null;
    const assignedCategoryMongoIds = [];
    const postTags = [];

    for (const ttId of postTtIds) {
      const tt = termTaxonomy[ttId];
      if (!tt) continue;

      if (tt.taxonomy === 'video') {
        const catMongoId = wpTaxToMongoCategory[ttId] || wpTermIdToMongoCategory[tt.term_id];
        if (catMongoId) {
          if (!assignedCategoryMongoIds.includes(catMongoId)) {
            assignedCategoryMongoIds.push(catMongoId);
          }
          if (tt.parent === '0' || tt.parent === 0) {
            parentCategoryMongoId = catMongoId;
          } else {
            subCategoryMongoId = catMongoId;
          }
        }
      } else if (tt.taxonomy === 'post_tag' || tt.taxonomy === 'tags') {
        const t = terms[tt.term_id];
        if (t && t.name) postTags.push(t.name);
      }
    }

    // 2E. Upsert Video in MongoDB
    const videoData = {
      title: v.title,
      slug: v.slug,
      description: meta['post_settings_post_content'] || meta['post_content'] || v.content || '',
      shortDescription: v.excerpt || '',
      videoUrl: finalVideoUrl,
      videoType: finalVideoUrl.startsWith('/uploads/') ? 'upload' : (finalVideoUrl ? 'external' : 'upload'),
      poster: finalPosterUrl,
      thumbnail: finalPosterUrl,
      choiceCategory: choiceCategories,
      ageGroup,
      maritalStatus,
      views,
      status: v.status || 'published',
      category: parentCategoryMongoId || assignedCategoryMongoIds[0] || null,
      subCategory: subCategoryMongoId || null,
      categories: assignedCategoryMongoIds,
      tags: postTags,
      layout: 'with_sidebar',
      showSidebar: true,
      displayContent: true,
      author: adminId,
      createdAt: v.date ? new Date(v.date) : new Date()
    };

    const existing = await Video.findOne({ slug: v.slug });
    if (existing) {
      await Video.findByIdAndUpdate(existing._id, videoData);
      updatedCount++;
    } else {
      await Video.create(videoData);
      createdCount++;
    }
  }

  console.log('\n--- Migration Finished Successfully! ---');
  console.log(`Created ${createdCount} videos in MongoDB`);
  console.log(`Updated ${updatedCount} existing videos in MongoDB`);
  console.log(`Total Videos in DB: ${await Video.countDocuments()}`);
  console.log(`Total Video Categories in DB: ${await Category.countDocuments({ type: 'video' })}`);
  console.log(`Total Media Library Items in DB: ${await Media.countDocuments()}`);

  process.exit(0);
}

runMigration().catch((err) => {
  console.error('Fatal Migration Error:', err);
  process.exit(1);
});
