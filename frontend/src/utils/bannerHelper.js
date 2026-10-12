// Shared Banner and Fallback Image Utility

export const FALLBACK_BANNERS = [
  // High quality cinematic & editorial banners
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1920&q=80', // Cinema production neon
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1920&q=80', // Theater cinema auditorium
  'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=1920&q=80', // Atmospheric moody forest
  'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1920&q=80', // Dark cinematic lighting
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1920&q=80', // Film reel vintage
  'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1920&q=80', // Cinematic noir city lights
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=80', // Cyberpunk neon glow
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1920&q=80'  // Studio dramatic backdrop
];

/**
 * Deterministically picks a banner from the fallback pool based on a string seed (e.g. ID, slug, title)
 */
export const getRandomBanner = (seed = '') => {
  if (!seed) {
    const randomIndex = Math.floor(Math.random() * FALLBACK_BANNERS.length);
    return FALLBACK_BANNERS[randomIndex];
  }
  let hash = 0;
  const str = String(seed);
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % FALLBACK_BANNERS.length;
  return FALLBACK_BANNERS[index];
};

/**
 * Resolves the banner image URL:
 * 1. Checks item.banner
 * 2. Checks item.featuredImage / item.poster / item.thumbnail
 * 3. Checks item.category.banner / item.parentCategory.banner
 * 4. Falls back to deterministic random image if nothing exists
 */
export const resolveBannerImage = (item, seedFallback = '') => {
  if (!item) return getRandomBanner(seedFallback);

  const direct =
    item.banner ||
    item.featuredImage ||
    item.poster ||
    item.thumbnail ||
    item.image ||
    item.coverImage;

  if (direct && typeof direct === 'string' && direct.trim()) {
    return direct;
  }

  // Check parent / category banner
  if (item.category && typeof item.category === 'object') {
    const catBanner = item.category.banner || item.category.thumbnail;
    if (catBanner && typeof catBanner === 'string' && catBanner.trim()) {
      return catBanner;
    }
  }

  if (item.parentCategory && typeof item.parentCategory === 'object') {
    const pBanner = item.parentCategory.banner || item.parentCategory.thumbnail;
    if (pBanner && typeof pBanner === 'string' && pBanner.trim()) {
      return pBanner;
    }
  }

  const seed = seedFallback || item._id || item.id || item.slug || item.title || item.name || '';
  return getRandomBanner(seed);
};
