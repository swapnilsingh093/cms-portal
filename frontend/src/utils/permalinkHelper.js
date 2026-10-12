/**
 * Permalink helper for WordPress-style category and post URL hierarchy.
 *
 * Full Hierarchy (when child category is assigned):
 *   Parent Category (L1) > 2. Level Sub Category (L2) > 3. Level Category (L3) > Assigned Post
 *   URL: /:module/:categorySlug/:subcategorySlug/:childCategorySlug/:postSlug
 *
 * Fallback (when 2. level sub category has NO child category assigned):
 *   Parent Category (L1) > 2. Level Sub Category (L2) > Assigned Post
 *   URL: /:module/:categorySlug/:subcategorySlug/:postSlug
 *
 * 1-Level Fallback (when only parent category is assigned):
 *   Parent Category (L1) > Assigned Post
 *   URL: /:module/:categorySlug/:postSlug
 *
 * Direct Fallback (unassigned):
 *   /:singleModule/:postSlug
 */

export const getItemPermalink = (item, moduleType = 'gallery') => {
  if (!item) return '#';

  const slug = item.slug || (typeof item === 'object' ? item._id : String(item));

  let mod = 'galleries';
  let singleMod = 'gallery';
  if (moduleType === 'story' || moduleType === 'stories' || moduleType === 'post' || moduleType === 'posts') {
    mod = 'stories';
    singleMod = 'story';
  } else if (moduleType === 'video' || moduleType === 'videos') {
    mod = 'videos';
    singleMod = 'video';
  }

  const catSlug = item.category?.slug || (typeof item.category === 'string' && !item.category.match(/^[0-9a-fA-F]{24}$/) ? item.category : null);
  const subSlug = item.subCategory?.slug || (typeof item.subCategory === 'string' && !item.subCategory.match(/^[0-9a-fA-F]{24}$/) ? item.subCategory : null);
  const childSlug = item.childCategory?.slug || (typeof item.childCategory === 'string' && !item.childCategory.match(/^[0-9a-fA-F]{24}$/) ? item.childCategory : null);

  // 1. Full 3-Level Category Hierarchy: L1 > L2 > L3 > Item
  if (catSlug && subSlug && childSlug) {
    return `/${mod}/${catSlug}/${subSlug}/${childSlug}/${slug}`;
  }

  // 2. 2-Level Category Hierarchy: L1 > L2 > Item
  if (catSlug && subSlug) {
    return `/${mod}/${catSlug}/${subSlug}/${slug}`;
  }

  // 3. 1-Level Category: L1 > Item
  if (catSlug) {
    return `/${mod}/${catSlug}/${slug}`;
  }

  // 4. Sub Category without Parent: L2 > L3 > Item or L2 > Item
  if (subSlug && childSlug) {
    return `/${mod}/${subSlug}/${childSlug}/${slug}`;
  }
  if (subSlug) {
    return `/${mod}/${subSlug}/${slug}`;
  }
  if (childSlug) {
    return `/${mod}/${childSlug}/${slug}`;
  }

  // Fallback
  return `/${singleMod}/${slug}`;
};

export const getCategoryPermalink = (cat, moduleType = 'gallery') => {
  if (!cat) return '#';
  const slug = cat.slug || (typeof cat === 'object' ? cat._id : String(cat));

  let mod = 'galleries';
  if (moduleType === 'story' || moduleType === 'stories' || moduleType === 'post' || moduleType === 'posts') {
    mod = 'stories';
  } else if (moduleType === 'video' || moduleType === 'videos') {
    mod = 'videos';
  }

  // Level 3 (has grandparent)
  if (cat.parentCategory?.parentCategory?.slug) {
    return `/${mod}/${cat.parentCategory.parentCategory.slug}/${cat.parentCategory.slug}/${slug}`;
  }

  // Level 2 (has parent)
  if (cat.parentCategory?.slug) {
    return `/${mod}/${cat.parentCategory.slug}/${slug}`;
  }

  // Level 1 Root
  return `/${mod}/${slug}`;
};
