const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const mammoth = require('mammoth');
const htmlToDocx = require('html-to-docx');
const AdmZip = require('adm-zip');
const { syncToMediaLibrary, getDiskPath } = require('./mediaHelper');

// Check if running on macOS with Apple Pages available
let isMacOS = process.platform === 'darwin';

/**
 * Execute an AppleScript snippet with promise
 */
const runAppleScript = (script, timeoutMs = 25000) => {
  return new Promise((resolve, reject) => {
    // Escape single quotes safely for zsh/bash execution
    const escaped = script.replace(/'/g, "'\\''");
    exec(`osascript -e '${escaped}'`, { timeout: timeoutMs }, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(stderr || error.message));
      }
      resolve(stdout ? stdout.trim() : '');
    });
  });
};

/**
 * Convert a .pages document to .docx
 * First tries native macOS Pages.app headless automation.
 * If not on Mac or if AppleScript fails, falls back to archive parsing.
 */
const convertPagesToDocx = async (pagesPath, tempDocxPath) => {
  if (isMacOS) {
    try {
      const absPagesPath = path.resolve(pagesPath);
      const absDocxPath = path.resolve(tempDocxPath);

      const script = `
        tell application "Pages"
          set theDoc to open (POSIX file "${absPagesPath}")
          export theDoc to (POSIX file "${absDocxPath}") as Microsoft Word
          close theDoc saving no
        end tell
      `;
      await runAppleScript(script);
      if (fs.existsSync(absDocxPath) && fs.statSync(absDocxPath).size > 0) {
        return { success: true, method: 'macos-pages' };
      }
    } catch (appleScriptErr) {
      console.warn('Native AppleScript Pages conversion failed, attempting fallback extraction:', appleScriptErr.message);
    }
  }

  return { success: false, method: 'fallback' };
};

/**
 * Convert local /uploads/... URLs to Base64 data URIs so html-to-docx embeds them in the Word file
 */
const inlineImagesAsBase64 = (html) => {
  if (!html || typeof html !== 'string') return html;

  return html.replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi, (match, src) => {
    try {
      if (src.startsWith('data:image/')) return match; // already base64

      const diskPath = getDiskPath(src);
      if (diskPath && fs.existsSync(diskPath)) {
        const fileBuf = fs.readFileSync(diskPath);
        const ext = path.extname(diskPath).toLowerCase().replace('.', '');
        const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext || 'png'}`;
        const base64Data = `data:${mime};base64,${fileBuf.toString('base64')}`;
        return match.replace(src, base64Data);
      }
    } catch (e) {
      console.error('Error inlining image for export:', e.message);
    }
    return match;
  });
};

/**
 * Import and parse a document (.docx or .pages)
 * Extracts all content, embedded images, title, excerpt, and layout.
 */
const importDocument = async (filePath, originalName, user = null) => {
  const ext = path.extname(originalName || filePath).toLowerCase();
  const rawBase = path.basename(originalName || filePath, ext);
  const cleanDocBase = rawBase.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'doc';
  const extractedImages = [];
  const claimedNames = new Set();
  let tempDocxCreated = null;
  let docxToParsePath = filePath;

  const now = new Date();
  const yearStr = String(now.getFullYear());
  const monthStr = String(now.getMonth() + 1).padStart(2, '0');
  const uploadsImgDir = path.join(__dirname, '..', 'uploads', 'images', yearStr, monthStr);
  if (!fs.existsSync(uploadsImgDir)) {
    fs.mkdirSync(uploadsImgDir, { recursive: true });
  }

  const getNextAvailableFilename = (prefix, extension) => {
    let candidate = `${prefix}${extension}`;
    let counter = 1;
    while (fs.existsSync(path.join(uploadsImgDir, candidate)) || claimedNames.has(candidate)) {
      candidate = `${prefix}-${counter}${extension}`;
      counter++;
    }
    claimedNames.add(candidate);
    return candidate;
  };

  // Handle .pages files
  if (ext === '.pages') {
    const tempDocxPath = path.join(
      path.dirname(filePath),
      `temp-converted-${Date.now()}-${Math.round(Math.random() * 1e6)}.docx`
    );
    const convResult = await convertPagesToDocx(filePath, tempDocxPath);

    if (convResult.success && fs.existsSync(tempDocxPath)) {
      tempDocxCreated = tempDocxPath;
      docxToParsePath = tempDocxPath;
    } else {
      // Fallback extraction for .pages on Linux or if Pages.app not available:
      // A .pages file is a zip bundle containing Data/ images and Preview.pdf
      try {
        const zip = new AdmZip(filePath);
        const zipEntries = zip.getEntries();
        let fallbackHtml = '';
        
        for (const entry of zipEntries) {
          if (!entry.isDirectory && entry.entryName.startsWith('Data/')) {
            const entryExt = path.extname(entry.entryName).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(entryExt)) {
              const imgBuf = entry.getData();
              const imgFilename = getNextAvailableFilename(`${cleanDocBase}-img`, entryExt);
              const imgDiskPath = path.join(uploadsImgDir, imgFilename);
              fs.writeFileSync(imgDiskPath, imgBuf);

              const publicUrl = `/uploads/images/${yearStr}/${monthStr}/${imgFilename}`;
              extractedImages.push(publicUrl);

              await syncToMediaLibrary({
                filename: imgFilename,
                originalName: path.basename(entry.entryName),
                mimeType: entryExt === '.jpg' || entryExt === '.jpeg' ? 'image/jpeg' : `image/${entryExt.replace('.', '')}`,
                extension: entryExt,
                size: imgBuf.length,
                url: publicUrl,
                mediaType: 'image',
                uploadedBy: user?._id || null
              });

              fallbackHtml += `<p><img src="${publicUrl}" alt="Pages Image" /></p>`;
            }
          }
        }

        const cleanBaseName = path.basename(originalName, ext).replace(/[-_]+/g, ' ').trim();
        return {
          title: cleanBaseName || 'Imported Pages Story',
          content: fallbackHtml || '<p>Content imported from Apple Pages.</p>',
          featuredImage: extractedImages[0] || '',
          extractedImages
        };
      } catch (zipErr) {
        throw new Error('Unable to parse .pages file: ' + zipErr.message);
      }
    }
  }

  // Parse .docx (either native or converted from .pages) using Mammoth
  const mammothOptions = {
    convertImage: mammoth.images.imgElement(async (image) => {
      try {
        const imageBuffer = await image.read();
        const imgExt = (image.contentType || 'image/jpeg').split('/')[1] || 'jpeg';
        const cleanExt = imgExt === 'jpeg' ? 'jpg' : imgExt.replace(/[^a-z0-9]/g, '');
        const filename = getNextAvailableFilename(`${cleanDocBase}-img`, `.${cleanExt}`);
        const diskPath = path.join(uploadsImgDir, filename);

        fs.writeFileSync(diskPath, imageBuffer);
        const publicUrl = `/uploads/images/${yearStr}/${monthStr}/${filename}`;
        extractedImages.push(publicUrl);

        await syncToMediaLibrary({
          filename,
          originalName: filename,
          mimeType: image.contentType || 'image/jpeg',
          extension: `.${cleanExt}`,
          size: imageBuffer.length,
          url: publicUrl,
          mediaType: 'image',
          uploadedBy: user?._id || null
        });

        return {
          src: publicUrl
        };
      } catch (imgErr) {
        console.error('Error saving document embedded image:', imgErr);
        return { src: '' };
      }
    })
  };

  try {
    const result = await mammoth.convertToHtml({ path: docxToParsePath }, mammothOptions);
    let htmlContent = result.value || '';

    // Extract title: from first <h1> tag or first line
    let extractedTitle = '';
    const h1Match = htmlContent.match(/<h[1-2][^>]*>(.*?)<\/h[1-2]>/i);
    if (h1Match && h1Match[1]) {
      extractedTitle = h1Match[1].replace(/<[^>]+>/g, '').trim();
      // Remove first H1 from content body so it is not duplicated
      htmlContent = htmlContent.replace(h1Match[0], '').trim();
    }

    if (!extractedTitle) {
      extractedTitle = path.basename(originalName, ext).replace(/[-_]+/g, ' ').trim();
    }

    // Capitalize title appropriately
    extractedTitle = extractedTitle.charAt(0).toUpperCase() + extractedTitle.slice(1);

    // Generate plain-text excerpt from first paragraph
    const pMatch = htmlContent.match(/<p[^>]*>(.*?)<\/p>/i);
    const excerpt = pMatch ? pMatch[1].replace(/<[^>]+>/g, '').trim().substring(0, 220) : '';

    return {
      title: extractedTitle,
      content: htmlContent,
      excerpt,
      featuredImage: extractedImages[0] || '',
      extractedImages
    };
  } finally {
    // Cleanup temporary converted docx
    if (tempDocxCreated && fs.existsSync(tempDocxCreated)) {
      try {
        fs.unlinkSync(tempDocxCreated);
      } catch (e) {}
    }
  }
};

/**
 * Export a Post to .docx or .pages
 */
const exportDocument = async (post, format = 'docx') => {
  const title = post.title || 'Untitled Post';
  const authorName = post.author?.name || 'Editorial Team';
  const catName = post.category?.name || 'General';
  const dateStr = post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '';

  // Prepare full rich HTML with embedded base64 images
  let inlinedBody = inlineImagesAsBase64(post.content || '');

  let featuredImgHtml = '';
  if (post.featuredImage) {
    const inlinedFeat = inlineImagesAsBase64(`<img src="${post.featuredImage}" />`);
    featuredImgHtml = `<p style="text-align: center; margin-bottom: 24px;">${inlinedFeat}</p>`;
  }

  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
      </head>
      <body>
        <h1 style="font-size: 26pt; font-weight: bold; color: #1e293b; margin-bottom: 8pt;">${title}</h1>
        <p style="font-size: 11pt; color: #64748b; margin-bottom: 20pt; border-bottom: 1px solid #cbd5e1; padding-bottom: 8pt;">
          <strong>Category:</strong> ${catName} | <strong>Author:</strong> ${authorName} | <strong>Date:</strong> ${dateStr}
        </p>
        ${featuredImgHtml}
        <div>${inlinedBody}</div>
      </body>
    </html>
  `;

  const docxBuffer = await htmlToDocx(fullHtml, null, {
    title,
    creator: authorName || 'CMS Portal',
    keywords: [catName, 'story', 'post']
  });

  const baseFileName = (post.slug || 'story').replace(/[^a-zA-Z0-9_-]/g, '-');

  // If user requested .pages format and system is macOS:
  if (format === 'pages' && isMacOS) {
    const tempDir = path.join(__dirname, '..', 'uploads', 'documents');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const tempDocxPath = path.join(tempDir, `export-${Date.now()}-${Math.round(Math.random() * 1e6)}.docx`);
    const tempPagesPath = path.join(tempDir, `export-${Date.now()}-${Math.round(Math.random() * 1e6)}.pages`);
    const tempPagesZipPath = tempPagesPath + '.zip';

    fs.writeFileSync(tempDocxPath, docxBuffer);

    try {
      const script = `
        tell application "Pages"
          set theDoc to open (POSIX file "${path.resolve(tempDocxPath)}")
          save theDoc in (POSIX file "${path.resolve(tempPagesPath)}")
          close theDoc saving no
        end tell
      `;
      await runAppleScript(script);

      if (fs.existsSync(tempPagesPath)) {
        // In modern macOS, .pages is either a single package or directory
        // If it's a directory, zip it so browsers can download it cleanly
        const isDir = fs.lstatSync(tempPagesPath).isDirectory();
        let finalBuf = null;
        if (isDir) {
          const zip = new AdmZip();
          zip.addLocalFolder(tempPagesPath);
          finalBuf = zip.toBuffer();
        } else {
          finalBuf = fs.readFileSync(tempPagesPath);
        }

        return {
          buffer: finalBuf,
          filename: `${baseFileName}.pages`,
          mimeType: 'application/x-iwork-pages-sffpages'
        };
      }
    } catch (pagesErr) {
      console.warn('Native Pages export failed, falling back to .docx:', pagesErr.message);
    } finally {
      try {
        if (fs.existsSync(tempDocxPath)) fs.unlinkSync(tempDocxPath);
        if (fs.existsSync(tempPagesPath)) fs.rmSync(tempPagesPath, { recursive: true, force: true });
        if (fs.existsSync(tempPagesZipPath)) fs.unlinkSync(tempPagesZipPath);
      } catch (e) {}
    }
  }

  // Default / Universal format: .docx (opens natively in MS Word and Apple Pages on Mac)
  return {
    buffer: docxBuffer,
    filename: `${baseFileName}.docx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
};

module.exports = {
  importDocument,
  exportDocument
};
