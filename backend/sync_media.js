const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

mongoose.connect('mongodb://localhost:27017/cms_portal').then(async () => {
  console.log('Connected to MongoDB');
  
  const MediaSchema = new mongoose.Schema({
    filename: String,
    originalName: String,
    mimeType: String,
    extension: String,
    size: Number,
    url: String,
    thumbnail: String,
    mediaType: { type: String, enum: ['image', 'video'] },
    uploadedBy: mongoose.Schema.Types.ObjectId,
    title: String
  }, { timestamps: true });
  
  let Media;
  try { Media = mongoose.model('Media'); } catch(e) { Media = mongoose.model('Media', MediaSchema); }

  const baseDir = path.join(__dirname, 'backend/uploads');
  const VIDEO_EXTS = new Set(['.mp4', '.webm', '.mov', '.m4v', '.avi', '.mkv', '.mpeg', '.mpg', '.ogv', '.3gp', '.ts']);
  const EXT_TO_MIME = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
    '.svg': 'image/svg+xml', '.gif': 'image/gif', '.bmp': 'image/bmp', '.tiff': 'image/tiff',
    '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.avi': 'video/x-msvideo'
  };

  // Scan all subdirs recursively
  function scanDir(dir, relBase) {
    const results = [];
    if (!fs.existsSync(dir)) return results;
    fs.readdirSync(dir).forEach(f => {
      if (f.startsWith('.') || f.startsWith('._')) return;
      const fullPath = path.join(dir, f);
      const st = fs.statSync(fullPath);
      if (st.isDirectory()) {
        results.push(...scanDir(fullPath, relBase + '/' + f));
      } else {
        results.push({ fullPath, relUrl: relBase + '/' + f, size: st.size });
      }
    });
    return results;
  }

  const files = scanDir(baseDir, '/uploads');
  console.log('Found files:', files.length);
  
  let synced = 0;
  for (const { fullPath, relUrl, size } of files) {
    const ext = path.extname(relUrl).toLowerCase();
    const isVideo = VIDEO_EXTS.has(ext) || relUrl.includes('/videos/');
    const mediaType = isVideo ? 'video' : 'image';
    const mimeType = EXT_TO_MIME[ext] || (isVideo ? 'video/mp4' : 'image/jpeg');
    const filename = path.basename(relUrl);
    
    const existing = await Media.findOne({ url: relUrl });
    if (!existing) {
      await Media.create({
        filename, originalName: filename, mimeType, extension: ext,
        size, url: relUrl, thumbnail: isVideo ? '' : relUrl, mediaType
      });
      console.log('Synced:', relUrl);
      synced++;
    }
  }
  
  console.log('Done! Synced', synced, 'files');
  const total = await Media.countDocuments({});
  console.log('Total media in DB:', total);
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
