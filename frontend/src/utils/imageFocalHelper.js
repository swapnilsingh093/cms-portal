/**
 * Smart Focal Point & Subject Adjustment Utility
 * 
 * Automatically detects image orientation, aspect ratio, and subjects (faces, people, objects)
 * using aspect-ratio geometry and lightweight canvas saliency (edge energy & skin tones)
 * so that people and main objects are always in-frame and never cut off by object-fit: cover.
 */

// Memory cache so we don't recalculate for the same image URL repeatedly
const focalCache = new Map();

/**
 * Calculates optimal object-position (e.g. '50% 20%') for an image element
 * @param {HTMLImageElement} imgElement
 * @returns {string} CSS object-position string
 */
export function getSmartObjectPosition(imgElement) {
  if (!imgElement) return 'center 25%';

  const src = imgElement.currentSrc || imgElement.src;
  if (src && focalCache.has(src)) {
    return focalCache.get(src);
  }

  const { naturalWidth: w, naturalHeight: h } = imgElement;
  if (!w || !h) return 'center 25%';

  const ratio = h / w;

  // 1. Baseline focal Y coordinate based on aspect ratio:
  // Most portrait photos have heads/faces in the upper 15%-25% of the frame.
  // Standard center-center (50% 50%) aggressively chops off heads.
  let defaultY = 25;
  let defaultX = 50;

  if (ratio >= 1.4) {
    // Ultra-tall vertical (9:16 phone / reel / vertical poster)
    defaultY = 16;
  } else if (ratio >= 1.15) {
    // Standard portrait (3:4, 4:5, 1080x1332)
    defaultY = 20;
  } else if (ratio >= 0.9) {
    // Square or near-square (1:1)
    defaultY = 26;
  } else if (ratio >= 0.65) {
    // Standard landscape (4:3, 16:10)
    defaultY = 32;
  } else {
    // Ultra-wide landscape (16:9, 21:9)
    defaultY = 38;
  }

  let finalPos = `${defaultX}% ${defaultY}%`;

  // 2. Attempt lightweight canvas saliency to detect exact visual focal point
  try {
    const sampleSize = 36;
    const canvas = document.createElement('canvas');
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (ctx) {
      ctx.drawImage(imgElement, 0, 0, sampleSize, sampleSize);
      const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize);
      const data = imgData.data;

      let totalWeight = 0;
      let sumX = 0;
      let sumY = 0;

      for (let y = 1; y < sampleSize - 1; y++) {
        for (let x = 1; x < sampleSize - 1; x++) {
          const idx = (y * sampleSize + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // Gradients / Edge contrast across neighbors
          const leftIdx = (y * sampleSize + (x - 1)) * 4;
          const rightIdx = (y * sampleSize + (x + 1)) * 4;
          const upIdx = ((y - 1) * sampleSize + x) * 4;
          const downIdx = ((y + 1) * sampleSize + x) * 4;

          const lumL = 0.299 * data[leftIdx] + 0.587 * data[leftIdx + 1] + 0.114 * data[leftIdx + 2];
          const lumR = 0.299 * data[rightIdx] + 0.587 * data[rightIdx + 1] + 0.114 * data[rightIdx + 2];
          const lumU = 0.299 * data[upIdx] + 0.587 * data[upIdx + 1] + 0.114 * data[upIdx + 2];
          const lumD = 0.299 * data[downIdx] + 0.587 * data[downIdx + 1] + 0.114 * data[downIdx + 2];

          const edgeEnergy = Math.abs(lumR - lumL) + Math.abs(lumD - lumU);

          // Skin-tone detection (warm human skin spectrum)
          const isSkinTone =
            r > 60 && g > 40 && b > 20 &&
            r > g && (r - g) >= 8 &&
            (r - b) >= 12 &&
            Math.abs(r - g) < 120;

          // Compositional rule: faces and key subjects are weighted higher in upper 65%
          const verticalBias = 1.0 + Math.max(0, (sampleSize * 0.65 - y) / (sampleSize * 0.65)) * 0.9;
          const skinMultiplier = isSkinTone ? 2.2 : 1.0;

          const weight = (edgeEnergy * 1.4 + (isSkinTone ? 45 : 0)) * skinMultiplier * verticalBias;

          if (weight > 12) {
            totalWeight += weight;
            sumX += x * weight;
            sumY += y * weight;
          }
        }
      }

      if (totalWeight > 50) {
        let focalX = Math.round((sumX / totalWeight / sampleSize) * 100);
        let focalY = Math.round((sumY / totalWeight / sampleSize) * 100);

        // Clamping to avoid extreme edge alignment
        focalX = Math.max(25, Math.min(75, focalX));

        // For portraits, strictly bias towards top half so heads/faces stay visible
        if (ratio >= 1.15) {
          focalY = Math.max(12, Math.min(32, focalY));
        } else if (ratio >= 0.9) {
          focalY = Math.max(16, Math.min(42, focalY));
        } else {
          focalY = Math.max(20, Math.min(55, focalY));
        }

        finalPos = `${focalX}% ${focalY}%`;
      }
    }
  } catch {
    // Cross-origin tainted canvas or unsupported: default baseline based on aspect ratio is preserved
  }

  if (src) {
    focalCache.set(src, finalPos);
  }

  return finalPos;
}

/**
 * Event handler for direct <img onLoad={autoAdjustImageFocal} />
 */
export function autoAdjustImageFocal(event) {
  const img = event?.currentTarget || event?.target;
  if (!img) return;

  const pos = getSmartObjectPosition(img);
  img.style.objectPosition = pos;
  img.dataset.smartFocal = pos;
}
