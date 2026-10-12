const fs = require('fs');
const path = require('path');
const Media = require('../models/Media');

const VIDEO_EXTS = new Set([
  '.mp4',
  '.webm',
  '.mov',
  '.m4v',
  '.avi',
  '.mkv',
  '.mpeg',
  '.mpg',
  '.ogv',
  '.3gp',
  '.ts'
]);

const IMAGE_EXTS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.svg',
  '.gif',
  '.bmp',
  '.tiff',
  '.tif'
]);

const DOC_EXTS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.csv',
  '.zip',
  '.rar',
  '.rtf',
  '.odt'
]);

const EXT_TO_MIME = {
  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',
  // Videos
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.m4v': 'video/x-m4v',
  '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska',
  '.mpeg': 'video/mpeg',
  '.mpg': 'video/mpeg',
  '.ogv': 'video/ogg',
  '.3gp': 'video/3gpp',
  '.ts': 'video/mp2t',
  // Documents
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.zip': 'application/zip',
  '.rar': 'application/x-rar-compressed',
  '.rtf': 'application/rtf',
  '.odt': 'application/vnd.oasis.opendocument.text'
};

/**
 * Safely resolve a URL or relative path to the absolute path on disk in backend/uploads
 */
const getDiskPath = (urlOrPath) => {
  if (!urlOrPath || typeof urlOrPath !== 'string') return null;
  let clean = urlOrPath.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    try {
      clean = new URL(clean).pathname;
    } catch (e) {
      clean = clean.replace(/^https?:\/\/[^\/]+/, '');
    }
  }
  clean = clean.split('?')[0].split('#')[0];
  try {
    clean = decodeURIComponent(clean);
  } catch (e) {}

  clean = clean.replace(/\\/g, '/');

  const uploadIdx = clean.indexOf('/uploads/');
  if (uploadIdx !== -1) {
    clean = clean.substring(uploadIdx);
    return path.join(__dirname, '..', clean);
  }

  if (clean.startsWith('uploads/')) {
    return path.join(__dirname, '..', clean);
  }

  return null;
};

/**
 * Delete a physical file from the uploads directory on disk, along with any Mac OS shadow files
 */
const deletePhysicalFile = (urlOrPath) => {
  if (!urlOrPath) return false;
  const filePath = getDiskPath(urlOrPath);
  let deleted = false;
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      deleted = true;
    } catch (e) {
      console.error(`Error deleting physical file ${filePath}:`, e.message);
    }
    // Also remove Mac OS resource fork / shadow file (._filename) if it exists
    try {
      const dir = path.dirname(filePath);
      const base = path.basename(filePath);
      const shadowPath = path.join(dir, '._' + base);
      if (fs.existsSync(shadowPath)) {
        fs.unlinkSync(shadowPath);
      }
    } catch (e) {}
  }
  return deleted;
};

/**
 * Get public URL for an uploaded file using its destination or path
 */
const getUploadedFileUrl = (file, defaultFolder = 'images') => {
  if (!file) return '';
  const relPath = (file.path || '').replace(/\\/g, '/');
  const uploadIdx = relPath.lastIndexOf('/uploads/');
  if (uploadIdx !== -1) {
    return relPath.substring(uploadIdx);
  }
  return `/uploads/${defaultFolder}/${file.filename}`;
};

/**
 * Save a base64 Data URL (e.g. video frame captured on canvas) to disk
 */
const saveBase64Image = (dataUrl, subDir = 'thumbnails', prefix = 'frame') => {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    return null;
  }
  try {
    const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!matches) return null;
    const extRaw = matches[1].toLowerCase();
    const ext = extRaw === 'jpeg' ? 'jpg' : extRaw;
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
    
    const now = new Date();
    const yearStr = String(now.getFullYear());
    const monthStr = String(now.getMonth() + 1).padStart(2, '0');
    const targetDir = path.join(__dirname, '..', 'uploads', subDir, yearStr, monthStr);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const targetPath = path.join(targetDir, filename);
    fs.writeFileSync(targetPath, buffer);
    return {
      filename,
      url: `/uploads/${subDir}/${yearStr}/${monthStr}/${filename}`,
      size: buffer.length,
      mimeType: `image/${ext === 'jpg' ? 'jpeg' : ext}`
    };
  } catch (err) {
    console.error('Error saving base64 image:', err.message);
    return null;
  }
};

/**
 * Register an uploaded or extracted asset in the central Media Library
 * STRICT: If the file does NOT exist on disk, it will NEVER be registered!
 */
const syncToMediaLibrary = async ({
  filename,
  originalName,
  mimeType,
  extension,
  size,
  url,
  thumbnail,
  mediaType,
  uploadedBy
}) => {
  if (!url) return null;
  try {
    const cleanUrl = url.replace(/\\/g, '/');
    const diskPath = getDiskPath(cleanUrl);

    // If it's a local /uploads/ asset, VERIFY it physically exists on disk!
    // Never create ghost / broken records for files that were deleted from disk!
    if (diskPath) {
      if (!fs.existsSync(diskPath)) {
        return null;
      }
    }

    const existing = await Media.findOne({ url: cleanUrl });
    const ext = (extension || path.extname(cleanUrl)).toLowerCase();
    const isVideo = VIDEO_EXTS.has(ext) || cleanUrl.includes('/videos/') || (mimeType && mimeType.startsWith('video/'));
    const isDoc = DOC_EXTS.has(ext) || cleanUrl.includes('/documents/') || (mimeType && (
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('word') ||
      mimeType.includes('sheet') ||
      mimeType.includes('text/') ||
      mimeType.includes('zip')
    ));

    const resolvedType = mediaType || (isVideo ? 'video' : (isDoc ? 'document' : 'image'));
    const resolvedMime = mimeType || EXT_TO_MIME[ext] || (isVideo ? 'video/mp4' : (isDoc ? 'application/octet-stream' : 'image/jpeg'));

    let resolvedSize = size || 0;
    if (!resolvedSize && diskPath && fs.existsSync(diskPath)) {
      try {
        resolvedSize = fs.statSync(diskPath).size;
      } catch (e) {}
    }

    const resolvedThumb = thumbnail || (resolvedType === 'image' ? cleanUrl : '');

    if (!existing) {
      return await Media.create({
        filename: filename || path.basename(cleanUrl),
        originalName: originalName || path.basename(cleanUrl),
        mimeType: resolvedMime,
        extension: ext,
        size: resolvedSize,
        url: cleanUrl,
        thumbnail: resolvedThumb,
        mediaType: resolvedType,
        uploadedBy: uploadedBy || null
      });
    } else {
      // Update missing fields if needed
      let changed = false;
      if (!existing.extension && ext) {
        existing.extension = ext;
        changed = true;
      }
      if (!existing.thumbnail && resolvedThumb) {
        existing.thumbnail = resolvedThumb;
        changed = true;
      }
      if ((!existing.size || existing.size === 0) && resolvedSize > 0) {
        existing.size = resolvedSize;
        changed = true;
      }
      if (existing.mediaType !== resolvedType) {
        existing.mediaType = resolvedType;
        changed = true;
      }
      if (changed) {
        await existing.save();
      }
      return existing;
    }
  } catch (e) {
    console.error('Error registering media item in Media Library:', e.message);
    return null;
  }
};

/**
 * Preserves media assets in Media Library.
 * Media files should NEVER be automatically deleted from disk when unlinking from galleries, videos, or posts.
 * Media files are ONLY deleted when explicitly removed by the user in the Media Library (/admin/media).
 */
const safeDeleteFile = (relativeUrl) => {
  // Intentional NO-OP: preserve file in Media Library
  return;
};

module.exports = {
  saveBase64Image,
  getUploadedFileUrl,
  syncToMediaLibrary,
  safeDeleteFile,
  getDiskPath,
  deletePhysicalFile,
  VIDEO_EXTS,
  IMAGE_EXTS,
  DOC_EXTS,
  EXT_TO_MIME
};
