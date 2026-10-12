const Media = require('../models/Media');
const Video = require('../models/Video');
const Gallery = require('../models/Gallery');
const Post = require('../models/Post');
const Page = require('../models/Page');
const Category = require('../models/Category');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const {
  syncToMediaLibrary,
  saveBase64Image,
  getDiskPath,
  deletePhysicalFile,
  VIDEO_EXTS,
  IMAGE_EXTS,
  DOC_EXTS,
  EXT_TO_MIME
} = require('../utils/mediaHelper');
const { getMonthDateRange, getAvailableDates } = require('../utils/dateHelper');

// @desc    Upload media item(s) - Global upload handler for entire CMS
// @route   POST /api/media/upload
// @access  Private (Admin / Editor)
exports.uploadMedia = async (req, res) => {
  try {
    let files = [];
    if (req.file) {
      files = [req.file];
    } else if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      files = req.files;
    } else if (req.files && typeof req.files === 'object') {
      // Named fields from multer
      Object.keys(req.files).forEach((key) => {
        if (Array.isArray(req.files[key])) {
          files.push(...req.files[key]);
        }
      });
    }

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select an image, video, or document to upload.'
      });
    }

    // Check if an auto-generated poster / thumbnail frame was sent
    let savedPosterUrl = '';
    if (req.body.autoPoster && typeof req.body.autoPoster === 'string' && req.body.autoPoster.startsWith('data:image/')) {
      const saved = saveBase64Image(req.body.autoPoster, 'thumbnails', 'poster');
      if (saved) savedPosterUrl = saved.url;
    }

    const createdItems = [];

    for (const file of files) {
      const ext = path.extname(file.originalname || '').toLowerCase();
      const isVideo =
        VIDEO_EXTS.has(ext) ||
        (file.mimetype && file.mimetype.startsWith('video/')) ||
        file.fieldname === 'video';

      const isDoc =
        DOC_EXTS.has(ext) ||
        file.fieldname === 'document' ||
        file.fieldname === 'doc' ||
        (file.mimetype && (
          file.mimetype.includes('pdf') ||
          file.mimetype.includes('document') ||
          file.mimetype.includes('word') ||
          file.mimetype.includes('sheet') ||
          file.mimetype.includes('presentation') ||
          file.mimetype.includes('zip') ||
          file.mimetype.includes('text/')
        ));

      const mediaType = isVideo ? 'video' : (isDoc ? 'document' : 'image');
      const mimeType =
        file.mimetype && file.mimetype !== 'application/octet-stream' && file.mimetype !== 'binary/octet-stream'
          ? file.mimetype
          : EXT_TO_MIME[ext] || (isVideo ? 'video/mp4' : (isDoc ? 'application/octet-stream' : 'image/jpeg'));

      // Normalize public URL path from file.path
      const relPath = (file.path || '').replace(/\\/g, '/');
      const uploadIdx = relPath.lastIndexOf('/uploads/');
      const defaultFolder = isVideo ? 'videos' : (isDoc ? 'documents' : 'images');
      const fileUrl =
        uploadIdx !== -1
          ? relPath.substring(uploadIdx)
          : `/uploads/${defaultFolder}/${file.filename}`;

      // Thumbnail
      let thumbnail = '';
      if (mediaType === 'image') {
        thumbnail = fileUrl;
      } else if (mediaType === 'video') {
        thumbnail = savedPosterUrl || req.body.thumbnail || req.body.poster || '';
      } else {
        thumbnail = '';
      }

      const media = await Media.create({
        filename: file.filename,
        originalName: file.originalname || file.filename,
        mimeType,
        extension: ext,
        size: file.size || 0,
        url: fileUrl,
        thumbnail,
        mediaType,
        uploadedBy: req.user ? req.user._id : null
      });

      createdItems.push(media);
    }

    res.status(201).json({
      success: true,
      message: `${createdItems.length} media file${createdItems.length > 1 ? 's' : ''} uploaded and stored successfully!`,
      media: createdItems[0],
      items: createdItems
    });
  } catch (error) {
    console.error('Upload media error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading media file'
    });
  }
};

// @desc    Get all media items for media picker / media library
// @route   GET /api/media
// @access  Private (Admin / Editor)
exports.getAllMedia = async (req, res) => {
  try {
    const { type, search, page = 1, limit = 40 } = req.query;
    let query = {};

    if (type && type !== 'all') {
      query.mediaType = type;
    }

    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { originalName: { $regex: q, $options: 'i' } },
        { filename: { $regex: q, $options: 'i' } },
        { extension: { $regex: q, $options: 'i' } }
      ];
    }

    const filterMonth = req.query.date || req.query.month;
    const dateRange = getMonthDateRange(filterMonth);
    if (dateRange) {
      const year = dateRange.year;
      const mPadded = dateRange.monthPadded;
      const dateCond = {
        $or: [
          { createdAt: { $gte: dateRange.startDate, $lt: dateRange.endDate } },
          { url: { $regex: `${year}/${mPadded}`, $options: 'i' } },
          { url: { $regex: `${year}-${mPadded}`, $options: 'i' } }
        ]
      };
      if (query.$or) {
        query = { $and: [{ $or: query.$or }, dateCond] };
      } else {
        query = { ...query, ...dateCond };
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Media.countDocuments(query);
    const media = await Media.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Summary counts for filter tabs (All, Images, Videos, Documents)
    const [allCount, imagesCount, videosCount, docsCount, availableDates] = await Promise.all([
      Media.countDocuments({}),
      Media.countDocuments({ mediaType: 'image' }),
      Media.countDocuments({ mediaType: 'video' }),
      Media.countDocuments({ mediaType: 'document' }),
      getAvailableDates(Media)
    ]);

    res.json({
      success: true,
      count: media.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)) || 1,
      availableDates,
      counts: {
        all: allCount,
        image: imagesCount,
        video: videosCount,
        document: docsCount
      },
      media
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching media'
    });
  }
};

// @desc    Delete media item permanently from server filesystem and database
// @route   DELETE /api/media/:id
// @access  Private (Admin / Editor)
exports.deleteMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media item not found'
      });
    }

    const deletedUrl = media.url;
    const deletedThumb = media.thumbnail;

    // Check if other Media records, or any Post, Gallery, Video, Category, or Page still reference this file
    const otherMediaCount = deletedUrl
      ? await Media.countDocuments({ url: deletedUrl, _id: { $ne: media._id } })
      : 0;

    const [inPost, inGallery, inVideo, inCat, inPage] = deletedUrl
      ? await Promise.all([
          Post.exists({ $or: [{ featuredImage: deletedUrl }, { banner: deletedUrl }, { videoUrl: deletedUrl }] }),
          Gallery.exists({ $or: [{ coverImage: deletedUrl }, { 'images.url': deletedUrl }] }),
          Video.exists({ $or: [{ videoUrl: deletedUrl }, { poster: deletedUrl }, { thumbnail: deletedUrl }] }),
          Category.exists({ $or: [{ thumbnail: deletedUrl }, { banner: deletedUrl }] }),
          Page.exists({ banner: deletedUrl })
        ])
      : [false, false, false, false, false];

    const isSharedOrActive = otherMediaCount > 0 || inPost || inGallery || inVideo || inCat || inPage;

    // If file is NOT shared by other media records and NOT in active use by posts/galleries, delete physical file
    if (!isSharedOrActive) {
      if (deletedUrl) deletePhysicalFile(deletedUrl);
      if (deletedThumb && deletedThumb !== deletedUrl) deletePhysicalFile(deletedThumb);
    } else {
      console.log(`[Media Delete] File ${deletedUrl} is still used by other records or posts. Removed duplicate media entry without unlinking physical file.`);
    }

    // Only clean references in collections if the item is NOT shared with other media records
    if (!otherMediaCount && !isSharedOrActive && deletedUrl) {
      await Promise.all([
        Video.updateMany({ videoUrl: deletedUrl }, { $set: { videoUrl: '' } }).catch(() => {}),
        Video.updateMany({ poster: deletedUrl }, { $set: { poster: '' } }).catch(() => {}),
        Video.updateMany({ thumbnail: deletedUrl }, { $set: { thumbnail: '' } }).catch(() => {}),
        Gallery.updateMany({ coverImage: deletedUrl }, { $set: { coverImage: '' } }).catch(() => {}),
        Gallery.updateMany({ 'images.url': deletedUrl }, { $pull: { images: { url: deletedUrl } } }).catch(() => {}),
        Post.updateMany({ featuredImage: deletedUrl }, { $set: { featuredImage: '' } }).catch(() => {}),
        Post.updateMany({ banner: deletedUrl }, { $set: { banner: '' } }).catch(() => {}),
        Post.updateMany({ videoUrl: deletedUrl }, { $set: { videoUrl: '' } }).catch(() => {}),
        Page.updateMany({ banner: deletedUrl }, { $set: { banner: '' } }).catch(() => {}),
        Category.updateMany({ thumbnail: deletedUrl }, { $set: { thumbnail: '' } }).catch(() => {}),
        Category.updateMany({ banner: deletedUrl }, { $set: { banner: '' } }).catch(() => {})
      ]);
    }

    // Remove media record from MongoDB
    await media.deleteOne();

    res.json({
      success: true,
      message: isSharedOrActive
        ? 'Duplicate media entry removed (original file preserved).'
        : 'Media file permanently deleted.'
    });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting media'
    });
  }
};

// @desc    Sync disk upload files and existing content assets into Media Library
// @route   POST /api/media/sync
// @access  Private (Admin)
exports.syncExistingUploads = async (req, res) => {
  try {
    let syncedCount = 0;
    let prunedCount = 0;
    const baseUploadDir = path.join(__dirname, '..', 'uploads');
    const subDirs = ['images', 'videos', 'thumbnails', 'banners', 'galleries', 'documents'];

    // 1. Scan filesystem for all actual files present on disk
    for (const sub of subDirs) {
      const fullDir = path.join(baseUploadDir, sub);
      if (fs.existsSync(fullDir)) {
        const files = fs.readdirSync(fullDir);
        for (const file of files) {
          if (file.startsWith('.') || file.startsWith('._')) continue;
          const filePath = path.join(fullDir, file);
          let stat;
          try {
            stat = fs.statSync(filePath);
          } catch (e) {
            continue;
          }
          if (stat.isFile()) {
            const relUrl = `/uploads/${sub}/${file}`;
            const ext = path.extname(file).toLowerCase();
            const isVideo = sub === 'videos' || VIDEO_EXTS.has(ext);
            const isDoc = sub === 'documents' || DOC_EXTS.has(ext);
            const mediaType = isVideo ? 'video' : (isDoc ? 'document' : 'image');
            const mimeType = EXT_TO_MIME[ext] || (isVideo ? 'video/mp4' : (isDoc ? 'application/octet-stream' : 'image/jpeg'));

            const item = await syncToMediaLibrary({
              filename: file,
              originalName: file,
              mimeType,
              extension: ext,
              size: stat.size,
              url: relUrl,
              mediaType,
              uploadedBy: req.user ? req.user._id : null
            });
            if (item) syncedCount++;
          }
        }
      }
    }

    // 2. Scan DB records (Videos, Galleries, Posts, Pages, Categories) ONLY IF FILE ACTUALLY EXISTS ON DISK
    const checkAndSync = async (candidateUrl, title, type, user) => {
      if (!candidateUrl) return;
      const diskPath = getDiskPath(candidateUrl);
      if (!diskPath || !fs.existsSync(diskPath)) {
        // Physical file does not exist on disk! NEVER sync non-existent or deleted files!
        return;
      }
      await syncToMediaLibrary({
        url: candidateUrl,
        originalName: title,
        mediaType: type,
        uploadedBy: user
      });
    };

    const videos = await Video.find({}).lean();
    for (const v of videos) {
      await checkAndSync(v.videoUrl, `${v.title}.mp4`, 'video', v.author);
      await checkAndSync(v.poster, `${v.title} - Poster`, 'image', v.author);
      await checkAndSync(v.thumbnail, `${v.title} - Thumbnail`, 'image', v.author);
    }

    const galleries = await Gallery.find({}).lean();
    for (const g of galleries) {
      await checkAndSync(g.coverImage, `${g.title} - Cover`, 'image', g.author);
      if (g.images && g.images.length > 0) {
        for (const img of g.images) {
          await checkAndSync(img.url, img.title || `${g.title} - Photo`, 'image', g.author);
        }
      }
    }

    const posts = await Post.find({}).lean();
    for (const p of posts) {
      await checkAndSync(p.featuredImage, `${p.title} - Featured`, 'image', p.author);
      await checkAndSync(p.banner, `${p.title} - Banner`, 'image', p.author);
      await checkAndSync(p.videoUrl, `${p.title} - Video`, 'video', p.author);
    }

    const pages = await Page.find({}).lean();
    for (const pg of pages) {
      await checkAndSync(pg.banner, `${pg.title} - Banner`, 'image', null);
    }

    const categories = await Category.find({}).lean();
    for (const c of categories) {
      await checkAndSync(c.thumbnail, `${c.name} - Thumbnail`, 'image', null);
      await checkAndSync(c.banner, `${c.name} - Banner`, 'image', null);
    }

    // 3. Purge / prune any broken Media records whose local upload file no longer exists on disk
    const allDbMedia = await Media.find({});
    for (const item of allDbMedia) {
      if (item.url && (item.url.startsWith('/uploads/') || item.url.includes('/uploads/'))) {
        const diskPath = getDiskPath(item.url);
        if (diskPath && !fs.existsSync(diskPath)) {
          await Media.findByIdAndDelete(item._id);
          prunedCount++;
        }
      }
    }

    const totalMedia = await Media.countDocuments({});

    res.json({
      success: true,
      message: `Media Library synchronized successfully! Total valid media items: ${totalMedia}${prunedCount > 0 ? ` (cleaned ${prunedCount} broken/deleted items)` : ''}`,
      totalMedia,
      syncedCount,
      prunedCount
    });
  } catch (error) {
    console.error('Sync media error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error synchronizing media library'
    });
  }
};

// Helper to download file
const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    };
    protocol.get(url, options, (response) => {
      if (response.statusCode === 200) {
        const file = fs.createWriteStream(dest);
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      } else {
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
};

exports.uploadByUrls = async (req, res) => {
  try {
    const { urls } = req.body;
    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ success: false, message: 'Invalid URLs array' });
    }

    const uploadedUrls = {};
    const imagesDir = path.join(__dirname, '../uploads/images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    for (const url of urls) {
      if (!url.startsWith('http')) continue;
      
      try {
        const ext = path.extname(url).split('?')[0] || '.jpg';
        const filename = `external-${Date.now()}-${Math.floor(Math.random() * 1000)}${ext}`;
        const dest = path.join(imagesDir, filename);
        
        await downloadFile(url, dest);
        
        const media = new Media({
          originalName: path.basename(url).split('?')[0],
          filename: filename,
          url: `/uploads/images/${filename}`,
          mimeType: 'image/jpeg',
          mediaType: 'image',
          size: fs.statSync(dest).size,
          uploadedBy: req.user._id
        });
        await media.save();
        
        uploadedUrls[url] = media.url;
      } catch (err) {
        console.error(`Error downloading ${url}:`, err);
      }
    }

    res.status(200).json({ success: true, urls: uploadedUrls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMediaById = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id).populate('uploadedBy', 'name email');
    if (!media) return res.status(404).json({ success: false, message: 'Media not found' });
    res.status(200).json({ success: true, media });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateMedia = async (req, res) => {
  try {
    const { altText, caption, description, originalName } = req.body;
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ success: false, message: 'Media not found' });

    if (altText !== undefined) media.altText = altText;
    if (caption !== undefined) media.caption = caption;
    if (description !== undefined) media.description = description;
    if (originalName !== undefined) media.originalName = originalName;

    await media.save();
    res.status(200).json({ success: true, media });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Bulk delete media items permanently from filesystem and database (WordPress style)
// @route   POST /api/media/bulk-delete
// @access  Private (Admin, Editor with media.delete permission)
exports.bulkDeleteMedia = async (req, res) => {
  try {
    const { ids, force = true } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "Please provide an array of media IDs to delete" });
    }

    const items = await Media.find({ _id: { $in: ids } });
    if (!items || items.length === 0) {
      return res.json({ success: true, deletedCount: 0, message: "No matching media items found." });
    }

    const deletedIds = [];
    const urlsToDelete = [];

    for (const media of items) {
      const url = media.url;
      const thumb = media.thumbnail;

      // Check if other Media records (outside ids being deleted) or active posts/pages/galleries/categories/videos use this URL
      const otherMediaCount = url
        ? await Media.countDocuments({ url: url, _id: { $nin: ids } })
        : 0;

      const [inPost, inGallery, inVideo, inCat, inPage] = url
        ? await Promise.all([
            Post.exists({ $or: [{ featuredImage: url }, { banner: url }, { videoUrl: url }] }),
            Gallery.exists({ $or: [{ coverImage: url }, { 'images.url': url }] }),
            Video.exists({ $or: [{ videoUrl: url }, { poster: url }, { thumbnail: url }] }),
            Category.exists({ $or: [{ thumbnail: url }, { banner: url }, { image: url }] }),
            Page.exists({ banner: url })
          ])
        : [false, false, false, false, false];

      const isSharedOrActive = otherMediaCount > 0 || inPost || inGallery || inVideo || inCat || inPage;

      // Only delete physical file if NOT shared by other media records and NOT in active use by content
      if (!isSharedOrActive) {
        if (url) deletePhysicalFile(url);
        if (thumb && thumb !== url) deletePhysicalFile(thumb);
        if (url) urlsToDelete.push(url);
      } else {
        console.log(`[Bulk Media Delete] File ${url} is still referenced by other records or posts. Duplicate media record removed without unlinking physical file.`);
      }

      deletedIds.push(media._id);
    }

    // 2. Only clean up references for URLs that are completely deleted and not shared
    if (urlsToDelete.length > 0) {
      await Promise.all([
        Video.updateMany({ videoUrl: { $in: urlsToDelete } }, { $set: { videoUrl: "" } }).catch(() => {}),
        Video.updateMany({ poster: { $in: urlsToDelete } }, { $set: { poster: "" } }).catch(() => {}),
        Video.updateMany({ thumbnail: { $in: urlsToDelete } }, { $set: { thumbnail: "" } }).catch(() => {}),
        Gallery.updateMany({ coverImage: { $in: urlsToDelete } }, { $set: { coverImage: "" } }).catch(() => {}),
        Gallery.updateMany({ "images.url": { $in: urlsToDelete } }, { $pull: { images: { url: { $in: urlsToDelete } } } }).catch(() => {}),
        Post.updateMany({ featuredImage: { $in: urlsToDelete } }, { $set: { featuredImage: "" } }).catch(() => {}),
        Post.updateMany({ banner: { $in: urlsToDelete } }, { $set: { banner: "" } }).catch(() => {}),
        Post.updateMany({ videoUrl: { $in: urlsToDelete } }, { $set: { videoUrl: "" } }).catch(() => {}),
        Page.updateMany({ banner: { $in: urlsToDelete } }, { $set: { banner: "" } }).catch(() => {}),
        Category.updateMany({ thumbnail: { $in: urlsToDelete } }, { $set: { thumbnail: "" } }).catch(() => {}),
        Category.updateMany({ banner: { $in: urlsToDelete } }, { $set: { banner: "" } }).catch(() => {}),
        Category.updateMany({ image: { $in: urlsToDelete } }, { $set: { image: "" } }).catch(() => {})
      ]);
    }

    // 3. Remove records from MongoDB in one fast batch
    await Media.deleteMany({ _id: { $in: deletedIds } });

    res.status(200).json({
      success: true,
      deletedCount: deletedIds.length,
      message: `${deletedIds.length} media item(s) processed. Duplicate records removed safely with originals preserved.`
    });
  } catch (error) {
    console.error("Bulk delete media error:", error);
    res.status(500).json({ success: false, message: error.message || "Error bulk deleting media" });
  }
};
