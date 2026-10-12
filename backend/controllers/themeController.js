const ThemeSettings = require('../models/ThemeSettings');

// @desc    Get current theme & appearance settings
// @route   GET /api/theme
// @access  Public
exports.getThemeSettings = async (req, res) => {
  try {
    let settings = await ThemeSettings.findOne();
    if (!settings) {
      settings = await ThemeSettings.create({
        siteTitle: 'My CMS Portal',
        tagline: 'Videos, Galleries & Stories',
        primaryColor: '#2271b1',
        accentColor: '#135e96',
        layout: 'standard',
        fontFamily: 'system',
        darkModePublic: false
      });
    }
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching theme settings'
    });
  }
};

// @desc    Update theme & appearance settings
// @route   PUT /api/theme
// @access  Private (Admin)
exports.updateThemeSettings = async (req, res) => {
  try {
    let settings = await ThemeSettings.findOne();
    if (!settings) {
      settings = new ThemeSettings();
    }

    const booleanFields = [
      'darkModePublic',
      'showAdminBar',
      'stickyHeader',
      'allowRegistration',
      'requireEmailVerification',
      'organizeByDate',
      'generateThumbnails',
      'enableCaptcha',
      'showFullPost'
    ];

    const numberFields = [
      'postsPerPage',
      'excerptLength',
      'maxLoginAttempts',
      'sessionTimeout'
    ];

    // Merge every setting sent in body
    for (const [key, value] of Object.entries(req.body)) {
      if (value === undefined) continue;

      if (booleanFields.includes(key)) {
        settings[key] = value === true || value === 'true' || value === 1 || value === '1';
      } else if (numberFields.includes(key) && value !== '') {
        const num = Number(value);
        settings[key] = isNaN(num) ? value : num;
      } else {
        settings[key] = value;
      }
    }

    await settings.save();

    res.json({
      success: true,
      message: 'Settings updated successfully!',
      settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating settings'
    });
  }
};
