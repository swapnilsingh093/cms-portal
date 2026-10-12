const mongoose = require('mongoose');

/**
 * Recursively retrieves all descendant category IDs (children, grandchildren, etc.)
 * for a given category ID so that querying a parent category includes all posts/videos/galleries
 * assigned to any child or subcategory under it.
 *
 * @param {string|mongoose.Types.ObjectId} rootCatId
 * @param {mongoose.Model} CategoryModel
 * @returns {Promise<Array<mongoose.Types.ObjectId>>} Array of category IDs including the root and all descendants
 */
const getAllCategoryDescendantIds = async (rootCatId, CategoryModel) => {
  if (!rootCatId) return [];

  const Category = CategoryModel || mongoose.model('Category');
  const targetId = mongoose.Types.ObjectId.isValid(rootCatId)
    ? new mongoose.Types.ObjectId(String(rootCatId))
    : null;

  if (!targetId) return [];

  const allIds = [targetId];
  const queue = [targetId];

  // Up to 10 iterations to prevent any accidental infinite loop while supporting deep trees
  let iterations = 0;
  while (queue.length > 0 && iterations < 10) {
    iterations++;
    const current = queue.pop();
    const children = await Category.find({
      $or: [{ parentCategory: current }, { parent: current }]
    })
      .select('_id')
      .lean();

    for (const child of children) {
      if (!allIds.some((id) => id.toString() === child._id.toString())) {
        allIds.push(child._id);
        queue.push(child._id);
      }
    }
  }

  return allIds;
};

/**
 * Given optional category, subCategory, childCategory, and categories,
 * resolves category references while strictly respecting user assignments.
 * Does NOT force parent categories if the user only assigned a subcategory.
 */
const resolveHierarchy = async ({ category, subCategory, childCategory, categories }, CategoryModel) => {
  const Category = CategoryModel || mongoose.model('Category');

  let resolvedCat = category ? (category._id || category) : null;
  let resolvedSub = subCategory ? (subCategory._id || subCategory) : null;
  let resolvedChild = childCategory ? (childCategory._id || childCategory) : null;

  // Clean empty/falsy strings
  if (!resolvedCat || resolvedCat === '' || resolvedCat === 'null' || resolvedCat === 'undefined') resolvedCat = null;
  if (!resolvedSub || resolvedSub === '' || resolvedSub === 'null' || resolvedSub === 'undefined') resolvedSub = null;
  if (!resolvedChild || resolvedChild === '' || resolvedChild === 'null' || resolvedChild === 'undefined') resolvedChild = null;

  let assignedCategoryIds = [];
  let isExplicitCategoriesProvided = false;

  if (Array.isArray(categories)) {
    isExplicitCategoriesProvided = true;
    assignedCategoryIds = categories.map((c) => (c?._id ? c._id : c)).filter(Boolean);
  } else if (categories && typeof categories === 'string') {
    isExplicitCategoriesProvided = true;
    try {
      const parsed = JSON.parse(categories);
      if (Array.isArray(parsed)) assignedCategoryIds = parsed.map((c) => (c?._id ? c._id : c)).filter(Boolean);
      else assignedCategoryIds = [categories].filter(Boolean);
    } catch {
      assignedCategoryIds = categories.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  // Filter out any invalid / dummy values
  assignedCategoryIds = assignedCategoryIds
    .map(String)
    .filter((id) => id && mongoose.Types.ObjectId.isValid(id));

  // If explicit categories array was not provided at all, fallback to slot params
  if (!isExplicitCategoriesProvided) {
    assignedCategoryIds = [resolvedCat, resolvedSub, resolvedChild]
      .filter(Boolean)
      .map(String)
      .filter((id) => id && mongoose.Types.ObjectId.isValid(id));
  }

  // Determine resolved slots strictly from what the user selected in assignedCategoryIds
  resolvedCat = null;
  resolvedSub = null;
  resolvedChild = null;

  if (assignedCategoryIds.length > 0) {
    try {
      const docs = await Category.find({ _id: { $in: assignedCategoryIds } }).populate('parentCategory').lean();
      for (const doc of docs) {
        if (!doc.parentCategory) {
          if (!resolvedCat) resolvedCat = doc._id;
        } else if (doc.parentCategory && !doc.parentCategory.parentCategory) {
          if (!resolvedSub) resolvedSub = doc._id;
        } else {
          if (!resolvedChild) resolvedChild = doc._id;
        }
      }
    } catch (e) {
      console.warn('Error categorizing slots by depth in resolveHierarchy:', e.message);
    }
  }

  // Deduplicate and convert to ObjectIds
  const allCategoryIds = Array.from(new Set(assignedCategoryIds))
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  return {
    category: resolvedCat && mongoose.Types.ObjectId.isValid(String(resolvedCat)) ? new mongoose.Types.ObjectId(String(resolvedCat)) : null,
    subCategory: resolvedSub && mongoose.Types.ObjectId.isValid(String(resolvedSub)) ? new mongoose.Types.ObjectId(String(resolvedSub)) : null,
    childCategory: resolvedChild && mongoose.Types.ObjectId.isValid(String(resolvedChild)) ? new mongoose.Types.ObjectId(String(resolvedChild)) : null,
    categories: allCategoryIds
  };
};

module.exports = {
  getAllCategoryDescendantIds,
  resolveHierarchy
};
