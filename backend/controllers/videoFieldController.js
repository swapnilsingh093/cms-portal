const VideoFieldGroup = require('../models/VideoFieldGroup');
const Video = require('../models/Video');
const Post = require('../models/Post');
const slugify = require('slugify');

// Default initial fields to auto-seed
const DEFAULT_FIELDS = [
  {
    title: 'Choice Category',
    key: 'choiceCategory',
    type: 'checkbox',
    options: ['Young Girl', 'Wife', 'Uncle', 'Old Man', 'Sasur'],
    order: 1,
    isSystem: true,
    showInSearch: true,
    showInEditor: true,
    isActive: true,
    description: 'Select multiple choice categories'
  },
  {
    title: 'Age Group',
    key: 'ageGroup',
    type: 'radio',
    options: ['20-25', '25-30', '30-35', '35-40', '40-45', '45-50', '50-55', '55-60'],
    order: 2,
    isSystem: true,
    showInSearch: true,
    showInEditor: true,
    isActive: true,
    description: 'Select a single age bracket'
  },
  {
    title: 'Marital Status',
    key: 'maritalStatus',
    type: 'radio',
    options: ['Married', 'Un-Married'],
    order: 3,
    isSystem: true,
    showInSearch: true,
    showInEditor: true,
    isActive: true,
    description: 'Select marital status'
  }
];

// Helper to seed defaults if empty
const ensureDefaults = async () => {
  const count = await VideoFieldGroup.countDocuments();
  if (count === 0) {
    await VideoFieldGroup.insertMany(DEFAULT_FIELDS);
  }
};

// @desc    Get all video field groups
// @route   GET /api/video-fields
// @access  Public / Admin
exports.getFieldGroups = async (req, res) => {
  try {
    await ensureDefaults();

    const query = {};
    if (req.query.activeOnly === 'true') {
      query.isActive = true;
    }

    const fields = await VideoFieldGroup.find(query).sort({ order: 1, createdAt: 1 });
    res.json({ success: true, data: fields });
  } catch (error) {
    console.error('Error fetching video field groups:', error);
    res.status(500).json({ success: false, message: 'Server error fetching video field groups' });
  }
};

// @desc    Create a new custom video field group
// @route   POST /api/video-fields
// @access  Private (Admin)
exports.createFieldGroup = async (req, res) => {
  try {
    const { title, key, type = 'checkbox', options = [], placeholder = '', description = '', showInSearch = true, showInEditor = true } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Field title is required' });
    }

    let generatedKey = key && key.trim()
      ? slugify(key.trim(), { lower: true, strict: true, replacement: '_' })
      : slugify(title.trim(), { lower: true, strict: true, replacement: '_' });

    // Ensure key starts with custom_ if not a system key
    if (!['choiceCategory', 'ageGroup', 'maritalStatus'].includes(generatedKey) && !generatedKey.startsWith('custom_')) {
      generatedKey = `custom_${generatedKey}`;
    }

    // Check duplicate key
    const existing = await VideoFieldGroup.findOne({ key: generatedKey });
    if (existing) {
      generatedKey = `${generatedKey}_${Date.now()}`;
    }

    // Clean options
    const cleanedOptions = Array.isArray(options)
      ? options.map(o => String(o).trim()).filter(Boolean)
      : String(options).split(',').map(o => o.trim()).filter(Boolean);

    // Get max order
    const maxOrderField = await VideoFieldGroup.findOne().sort({ order: -1 });
    const order = (maxOrderField?.order || 0) + 1;

    const newField = await VideoFieldGroup.create({
      title: title.trim(),
      key: generatedKey,
      type,
      options: cleanedOptions,
      placeholder: placeholder.trim(),
      description: description.trim(),
      order,
      isSystem: false,
      showInSearch: Boolean(showInSearch),
      showInEditor: Boolean(showInEditor),
      isActive: true
    });

    res.status(201).json({ success: true, data: newField, message: 'Field group created successfully' });
  } catch (error) {
    console.error('Error creating video field group:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error creating field group' });
  }
};

// @desc    Update a video field group (and its options)
// @route   PUT /api/video-fields/:id
// @access  Private (Admin)
exports.updateFieldGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const field = await VideoFieldGroup.findById(id);

    if (!field) {
      return res.status(404).json({ success: false, message: 'Field group not found' });
    }

    const {
      title,
      type,
      options,
      renameOption,
      placeholder,
      description,
      showInSearch,
      showInEditor,
      isActive,
      order
    } = req.body;

    const oldOptions = [...(field.options || [])];
    let newOptionsList = null;

    if (title && title.trim()) {
      field.title = title.trim();
    }

    if (type && !field.isSystem) {
      field.type = type;
    }

    if (options !== undefined) {
      newOptionsList = Array.isArray(options)
        ? options.map(o => String(o).trim()).filter(Boolean)
        : String(options).split(',').map(o => o.trim()).filter(Boolean);
      field.options = newOptionsList;
    }

    if (placeholder !== undefined) field.placeholder = String(placeholder).trim();
    if (description !== undefined) field.description = String(description).trim();
    if (showInSearch !== undefined) field.showInSearch = Boolean(showInSearch);
    if (showInEditor !== undefined) field.showInEditor = Boolean(showInEditor);
    if (isActive !== undefined) field.isActive = Boolean(isActive);
    if (order !== undefined) field.order = Number(order) || 0;

    await field.save();

    // Cascade option renames across existing Video and Post documents in MongoDB
    if (newOptionsList && oldOptions.length > 0) {
      const fieldKeyLower = (field.key || '').toLowerCase();
      const renames = [];

      if (renameOption && renameOption.oldVal && renameOption.newVal) {
        renames.push({
          oldVal: String(renameOption.oldVal).trim(),
          newVal: String(renameOption.newVal).trim()
        });
      } else if (oldOptions.length === newOptionsList.length) {
        for (let i = 0; i < oldOptions.length; i++) {
          if (oldOptions[i] !== newOptionsList[i]) {
            renames.push({ oldVal: oldOptions[i], newVal: newOptionsList[i] });
          }
        }
      }

      for (const { oldVal, newVal } of renames) {
        if (!oldVal || !newVal || oldVal === newVal) continue;

        if (fieldKeyLower === 'agegroup') {
          const oldClean = oldVal.replace(/\s*(yrs|yr|years)/gi, '').trim();
          await Video.updateMany(
            {
              $or: [
                { ageGroup: oldVal },
                { ageGroup: oldClean },
                { ageGroup: `${oldClean} yrs` },
                { ageGroup: `${oldClean} yr` },
                { ageGroup: { $regex: `^\\s*${oldClean}(\\s*(yrs|yr|years)?)?\\s*$`, $options: 'i' } }
              ]
            },
            { $set: { ageGroup: newVal } }
          );
        } else if (fieldKeyLower === 'choicecategory') {
          await Video.updateMany(
            { choiceCategory: oldVal },
            { $set: { 'choiceCategory.$[elem]': newVal } },
            { arrayFilters: [{ 'elem': oldVal }] }
          );
        } else if (fieldKeyLower === 'maritalstatus') {
          await Video.updateMany(
            { maritalStatus: oldVal },
            { $set: { maritalStatus: newVal } }
          );
          await Post.updateMany(
            { maritalStatus: oldVal },
            { $set: { maritalStatus: newVal } }
          ).catch(() => {});
        } else {
          // Custom field
          await Video.updateMany(
            { [`customFields.${field.key}`]: oldVal },
            { $set: { [`customFields.${field.key}`]: newVal } }
          );
        }
      }
    }

    res.json({ success: true, data: field, message: 'Field group updated successfully and existing records synced' });
  } catch (error) {
    console.error('Error updating video field group:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error updating field group' });
  }
};

// @desc    Delete a custom video field group
// @route   DELETE /api/video-fields/:id
// @access  Private (Admin)
exports.deleteFieldGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const field = await VideoFieldGroup.findById(id);

    if (!field) {
      return res.status(404).json({ success: false, message: 'Field group not found' });
    }

    if (field.isSystem) {
      return res.status(400).json({
        success: false,
        message: 'System field groups (Choice Category, Age Group, Marital Status) cannot be deleted. You can edit, add, or remove their options instead.'
      });
    }

    await VideoFieldGroup.findByIdAndDelete(id);

    res.json({ success: true, message: 'Field group deleted successfully' });
  } catch (error) {
    console.error('Error deleting video field group:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error deleting field group' });
  }
};

// @desc    Reorder video field groups
// @route   PUT /api/video-fields/reorder
// @access  Private (Admin)
exports.reorderFieldGroups = async (req, res) => {
  try {
    const { orderList } = req.body; // Array of { id, order }

    if (!Array.isArray(orderList)) {
      return res.status(400).json({ success: false, message: 'orderList must be an array of { id, order }' });
    }

    const bulkOps = orderList.map(item => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { order: item.order } }
      }
    }));

    if (bulkOps.length > 0) {
      await VideoFieldGroup.bulkWrite(bulkOps);
    }

    const updated = await VideoFieldGroup.find().sort({ order: 1 });
    res.json({ success: true, data: updated, message: 'Order updated successfully' });
  } catch (error) {
    console.error('Error reordering video field groups:', error);
    res.status(500).json({ success: false, message: 'Server error reordering field groups' });
  }
};
