const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload folders exist
const baseUploadDir = path.join(__dirname, '..', 'uploads');
const subDirs = ['images', 'videos', 'thumbnails', 'banners', 'galleries', 'documents'];

subDirs.forEach((dir) => {
  const fullPath = path.join(baseUploadDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Supported Image Formats: JPG/JPEG, PNG, WEBP, SVG, GIF, BMP, TIFF/TIF
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

// Supported Video Formats: MP4, WEBM, MOV, M4V, AVI, MKV, MPEG/MPG, OGV, 3GP, TS
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

// Supported Document Formats: PDF, DOC, DOCX, PAGES, TXT, XLS, XLSX, PPT, PPTX, CSV, ZIP, RAR, RTF, ODT
const DOC_EXTS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.pages',
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

// Extension to MIME type mapping for normalization
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
  '.pages': 'application/x-iwork-pages-sffpages',
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

const ALLOWED_EXACT_MIMES = new Set([
  'application/octet-stream',
  'video/octet-stream',
  'binary/octet-stream'
]);

// Configure Multer Disk Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const isVideo =
      file.fieldname === 'video' ||
      VIDEO_EXTS.has(ext) ||
      (file.mimetype && file.mimetype.startsWith('video/'));

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

    let folder = 'images';

    if (isVideo) {
      folder = 'videos';
    } else if (isDoc) {
      folder = 'documents';
    } else if (file.fieldname === 'thumbnail') {
      folder = 'thumbnails';
    } else if (file.fieldname === 'banner' || file.fieldname === 'poster' || file.fieldname === 'coverImage') {
      folder = 'banners';
    } else if (file.fieldname === 'galleryImages' || file.fieldname === 'images') {
      folder = 'galleries';
    }

    const now = new Date();
    const yearStr = String(now.getFullYear());
    const monthStr = String(now.getMonth() + 1).padStart(2, '0');
    const destPath = path.join(baseUploadDir, folder, yearStr, monthStr);
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    file.targetFolder = destPath;
    cb(null, destPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const baseName = path.basename(file.originalname || 'upload', ext);
    // Sanitize base name
    const cleanBase = baseName.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'file';
    
    // Check destination directory for duplicates and number sequentially: file.ext, file-1.ext, file-2.ext, etc.
    const destDir = file.targetFolder || path.join(baseUploadDir, 'images');
    req._claimedFilePaths = req._claimedFilePaths || new Set();

    let candidate = `${cleanBase}${ext}`;
    let candidatePath = path.join(destDir, candidate);
    let counter = 1;

    while (
      fs.existsSync(candidatePath) ||
      req._claimedFilePaths.has(candidatePath)
    ) {
      candidate = `${cleanBase}-${counter}${ext}`;
      candidatePath = path.join(destDir, candidate);
      counter++;
    }

    req._claimedFilePaths.add(candidatePath);
    cb(null, candidate);
  }
});

// File filter validating extension or MIME type
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  const isKnownImage = IMAGE_EXTS.has(ext) || mime.startsWith('image/');
  const isKnownVideo = VIDEO_EXTS.has(ext) || mime.startsWith('video/');
  const isKnownDoc = DOC_EXTS.has(ext) || (
    mime.includes('pdf') ||
    mime.includes('document') ||
    mime.includes('word') ||
    mime.includes('sheet') ||
    mime.includes('presentation') ||
    mime.includes('zip') ||
    mime.includes('text/')
  );
  const isGenericMime = ALLOWED_EXACT_MIMES.has(mime) && (IMAGE_EXTS.has(ext) || VIDEO_EXTS.has(ext) || DOC_EXTS.has(ext));

  if (isKnownImage || isKnownVideo || isKnownDoc || isGenericMime) {
    if ((mime === 'application/octet-stream' || mime === 'binary/octet-stream' || !mime) && EXT_TO_MIME[ext]) {
      file.mimetype = EXT_TO_MIME[ext];
    }
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type (${mime || 'unknown'}, ${ext || 'no-extension'}). Supported image, video, and document formats.`
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 1024 // 1GB maximum per file
  }
});

module.exports = upload;
