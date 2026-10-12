const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Category = require('../models/Category');
const Media = require('../models/Media');
const User = require('../models/User');

const WP_UPLOADS = path.resolve(__dirname, '../../../myHot/wp-content/uploads');
const LOCAL_UPLOADS = path.resolve(__dirname, '../uploads');
const LOCAL_THUMBNAILS = path.join(LOCAL_UPLOADS, 'thumbnails');
const LOCAL_BANNERS = path.join(LOCAL_UPLOADS, 'banners');

if (!fs.existsSync(LOCAL_THUMBNAILS)) fs.mkdirSync(LOCAL_THUMBNAILS, { recursive: true });
if (!fs.existsSync(LOCAL_BANNERS)) fs.mkdirSync(LOCAL_BANNERS, { recursive: true });

// Mapping of video category/subcategory slugs to their WordPress upload relative paths
const videoCategoryImages = {
  'indian-videos': '2023/10/c-076.jpg',
  'pakistani': '2022/02/FILE1534.jpg',
  'bangla': '2023/09/Screenshot_7.png',
  'tulsi-bhabi': '2022/01/images9.jpg',
  'tulsi-bhabi-2': '2022/01/images9.jpg',
  'uncle': '2022/05/ANRGB3-7f3b5ffcd2b06537f.jpg',
  'uncle-2': '2022/05/ANRGB3-7f3b5ffcd2b06537f.jpg',
  'uncle-pakistani': '2022/02/boss_with_screaty-62.jpg',
  'young-girl': '2026/06/Vinny-03-Filipina-Maid-in-black-bra-is-ready-for-hard-Sex.jpg',
  'sasur': '2022/10/vlcsnap-2022-10-29-23h45m46s421.png',
  'web-series': '2022/10/trashed-1669519084-desi-college-teen-boobs-aur-gaand-sex-ke-mast-photos.webp'
};

async function migrateCategoryImages() {
  const dbUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cms_portal';
  await mongoose.connect(dbUri);
  console.log('Connected to MongoDB:', dbUri);

  const adminUser = await User.findOne({ role: 'admin' });
  const adminId = adminUser ? adminUser._id : null;

  console.log('--- Migrating Video Category & Subcategory Images ---');

  for (const [slug, relPath] of Object.entries(videoCategoryImages)) {
    const srcPath = path.join(WP_UPLOADS, relPath);
    if (!fs.existsSync(srcPath)) {
      console.warn('Source file not found:', srcPath);
      continue;
    }

    const baseName = 'wp-cat-' + path.basename(relPath);
    const destThumb = path.join(LOCAL_THUMBNAILS, baseName);
    const destBanner = path.join(LOCAL_BANNERS, baseName);

    fs.copyFileSync(srcPath, destThumb);
    fs.copyFileSync(srcPath, destBanner);

    const thumbUrl = '/uploads/thumbnails/' + baseName;
    const bannerUrl = '/uploads/banners/' + baseName;

    // Register Media in CMS
    const stats = fs.statSync(destThumb);
    const ext = path.extname(baseName).toLowerCase().replace('.', '');
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    await Media.findOneAndUpdate(
      { filename: baseName },
      {
        filename: baseName,
        originalName: path.basename(relPath),
        url: thumbUrl,
        fileUrl: thumbUrl,
        mediaType: 'image',
        mimeType: mime,
        size: stats.size,
        uploadedBy: adminId
      },
      { upsert: true, returnDocument: 'after' }
    );

    // Update Category in MongoDB
    const updated = await Category.updateMany(
      { slug, type: 'video' },
      {
        $set: {
          thumbnail: thumbUrl,
          banner: bannerUrl,
          bannerImage: bannerUrl,
          bannerType: 'image'
        }
      }
    );

    console.log(`Synced image for category [${slug}]: ${thumbUrl} (Updated ${updated.modifiedCount} records)`);
  }

  console.log('\n--- Current Video Categories in MongoDB ---');
  const allVideoCats = await Category.find({ type: 'video' });
  allVideoCats.forEach((c) => {
    console.log(`- [${c.type}] ${c.name} (${c.slug}) -> thumbnail: "${c.thumbnail}", banner: "${c.banner}"`);
  });

  console.log('\nCategory images migration completed successfully!');
  process.exit(0);
}

migrateCategoryImages().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
