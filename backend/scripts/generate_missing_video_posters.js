const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Video = require('../models/Video');
const Media = require('../models/Media');
const User = require('../models/User');

const LOCAL_UPLOADS = path.resolve(__dirname, '../uploads');
const LOCAL_VIDEOS = path.join(LOCAL_UPLOADS, 'videos');
const LOCAL_THUMBNAILS = path.join(LOCAL_UPLOADS, 'thumbnails');

if (!fs.existsSync(LOCAL_THUMBNAILS)) fs.mkdirSync(LOCAL_THUMBNAILS, { recursive: true });

async function run() {
  const dbUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cms_portal';
  await mongoose.connect(dbUri);
  console.log('Connected to MongoDB:', dbUri);

  const adminUser = await User.findOne({ role: 'admin' });
  const adminId = adminUser ? adminUser._id : null;

  const allVideos = await Video.find({});
  console.log(`Checking ${allVideos.length} videos in database...`);

  let updatedCount = 0;

  for (const v of allVideos) {
    const hasValidPoster = v.poster && v.poster.trim() !== '';
    const hasValidThumb = v.thumbnail && v.thumbnail.trim() !== '';

    if (hasValidPoster && hasValidThumb) {
      continue;
    }

    if (!v.videoUrl) {
      console.log(`Video [${v.title}] has no videoUrl, skipping.`);
      continue;
    }

    const videoFileName = path.basename(v.videoUrl);
    const videoFilePath = path.join(LOCAL_VIDEOS, videoFileName);

    if (!fs.existsSync(videoFilePath)) {
      console.warn(`Video file not found on disk: ${videoFilePath} for [${v.title}]`);
      continue;
    }

    console.log(`Generating poster for: "${v.title}" (${videoFileName})...`);

    try {
      // Use macOS built-in QuickLook thumbnail generator
      execSync(`qlmanage -t -s 800 -o "${LOCAL_THUMBNAILS}" "${videoFilePath}"`, { stdio: 'pipe' });

      // qlmanage generates <videoFileName>.png
      const generatedPngName = `${videoFileName}.png`;
      const generatedPngPath = path.join(LOCAL_THUMBNAILS, generatedPngName);

      if (fs.existsSync(generatedPngPath)) {
        const posterUrl = `/uploads/thumbnails/${generatedPngName}`;
        const stats = fs.statSync(generatedPngPath);

        // Register in Media collection
        await Media.findOneAndUpdate(
          { filename: generatedPngName },
          {
            filename: generatedPngName,
            originalName: `${v.slug}-poster.png`,
            url: posterUrl,
            fileUrl: posterUrl,
            mediaType: 'image',
            mimeType: 'image/png',
            size: stats.size,
            uploadedBy: adminId
          },
          { upsert: true, returnDocument: 'after' }
        );

        // Update Video in DB
        v.poster = posterUrl;
        v.thumbnail = posterUrl;
        await v.save();

        console.log(`  -> Successfully updated poster: ${posterUrl}`);
        updatedCount++;
      } else {
        console.warn(`  -> qlmanage ran but file ${generatedPngPath} not found`);
      }
    } catch (err) {
      console.error(`  -> Failed to generate thumbnail for ${v.title}:`, err.message);
    }
  }

  console.log(`\nFinished! Updated ${updatedCount} videos with generated posters.`);

  // Final count check
  const stillMissing = await Video.countDocuments({
    $or: [{ poster: '' }, { poster: null }, { thumbnail: '' }, { thumbnail: null }]
  });
  console.log(`Videos still missing poster/thumbnail: ${stillMissing}`);

  process.exit(0);
}

run().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
