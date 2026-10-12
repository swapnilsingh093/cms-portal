const Menu = require('../models/Menu');

// @desc    Get all menus
// @route   GET /api/menus
// @access  Public
exports.getMenus = async (req, res) => {
  try {
    const { location } = req.query;
    let query = {};
    if (location) query.location = location;

    const menus = await Menu.find(query).sort({ createdAt: 1 });
    res.json({
      success: true,
      count: menus.length,
      menus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching menus'
    });
  }
};

// @desc    Get single menu by location (e.g. 'header' or 'footer')
// @route   GET /api/menus/location/:location
// @access  Public
exports.getMenuByLocation = async (req, res) => {
  try {
    const menu = await Menu.findOne({
      location: req.params.location,
      isActive: true
    });

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: `No active menu found for location: ${req.params.location}`
      });
    }

    res.json({
      success: true,
      menu
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching menu'
    });
  }
};

// @desc    Create new menu
// @route   POST /api/menus
// @access  Private (Admin)
exports.createMenu = async (req, res) => {
  try {
    const { title, location, items, isActive } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Menu title is required'
      });
    }

    const menu = await Menu.create({
      title,
      location: location || 'header',
      items: items || [],
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      success: true,
      message: 'Menu created successfully!',
      menu
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating menu'
    });
  }
};

// @desc    Update menu items & hierarchy
// @route   PUT /api/menus/:id
// @access  Private (Admin)
exports.updateMenu = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }

    const { title, location, items, isActive } = req.body;

    if (title) menu.title = title;
    if (location) menu.location = location;
    if (items !== undefined) menu.items = items;
    if (isActive !== undefined) menu.isActive = isActive;

    await menu.save();

    res.json({
      success: true,
      message: 'Menu updated successfully',
      menu
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating menu'
    });
  }
};

// @desc    Delete menu
// @route   DELETE /api/menus/:id
// @access  Private (Admin)
exports.deleteMenu = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }

    await menu.deleteOne();

    res.json({
      success: true,
      message: 'Menu deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting menu'
    });
  }
};
