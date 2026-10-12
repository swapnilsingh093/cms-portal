const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ThemeSettings = require('../models/ThemeSettings');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/emailService');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'cms_super_secret_jwt_key_2026',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Auto-derive or sanitize username
    let cleanUsername = (username || '').trim().toLowerCase();
    if (!cleanUsername) {
      cleanUsername = cleanEmail.split('@')[0].replace(/[^a-z0-9_.-]/g, '');
    }
    if (cleanUsername.length < 3) {
      cleanUsername = 'user_' + cleanUsername;
    }

    if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(cleanUsername)) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 30 characters and contain only letters, numbers, underscores, dots, or hyphens'
      });
    }

    // Check if email or username already exists
    const [existingEmail, existingUsername] = await Promise.all([
      User.findOne({ email: cleanEmail }),
      User.findOne({ username: cleanUsername })
    ]);

    if (existingEmail && existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Both username and email already exist'
      });
    }

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'This username is already taken. Please choose another username'
      });
    }

    // Check if this is the first user ever registered; if so, make them 'admin'
    const isFirstAccount = (await User.countDocuments({})) === 0;
    const role = isFirstAccount ? 'admin' : 'user';

    // Fetch theme/system settings for approval requirements
    const settings = (await ThemeSettings.findOne({})) || {};
    const requireApproval = isFirstAccount ? false : (settings.requireAdminApproval !== false);
    const initialStatus = requireApproval ? 'pending' : 'active';

    const user = await User.create({
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      password,
      role,
      status: initialStatus
    });

    // Send welcome email asynchronously
    sendWelcomeEmail({ to: user.email, name: user.name }).catch((err) => {
      console.warn('[Register] Welcome email notice:', err.message);
    });

    // If approval is required, do NOT issue login token
    if (user.status === 'pending') {
      const pendingMsg = settings.pendingApprovalMessage || 'Aapki registration request abhi pending hai. Administrator ke approve karne ke baad aap login kar sakenge.';
      return res.status(201).json({
        success: true,
        pendingApproval: true,
        message: pendingMsg,
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status
        }
      });
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: isFirstAccount
        ? 'Admin account created successfully!'
        : 'Account created successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        status: user.status,
        permissions: user.permissions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
};

// @desc    Login user & get token (supports both email and username)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const rawIdentifier = req.body.loginIdentifier || req.body.email || req.body.username || req.body.login || '';
    const { password } = req.body;
    const identifier = rawIdentifier.trim();

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username or email and password'
      });
    }

    const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const lowerIdentifier = identifier.toLowerCase();

    // Find user by either email OR username (exact lower or case-insensitive regex)
    const user = await User.findOne({
      $or: [
        { email: lowerIdentifier },
        { username: lowerIdentifier },
        { email: { $regex: `^${escaped}$`, $options: 'i' } },
        { username: { $regex: `^${escaped}$`, $options: 'i' } }
      ]
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/email or password'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/email or password'
      });
    }

    // Fetch theme settings for custom configured approval/status messages
    const settings = (await ThemeSettings.findOne({})) || {};

    if (user.status === 'pending') {
      const msg = settings.pendingApprovalMessage || 'Aapki registration request abhi pending hai. Administrator ke approve karne ke baad aap login kar sakenge.';
      return res.status(403).json({
        success: false,
        accountStatus: 'pending',
        message: msg
      });
    }

    if (user.status === 'rejected') {
      const msg = settings.rejectedApprovalMessage || 'Aapki registration request ko administrator dwara reject kar diya gaya hai. Kripya support se sampark karein.';
      return res.status(403).json({
        success: false,
        accountStatus: 'rejected',
        message: msg
      });
    }

    if (user.status === 'suspended' || user.status === 'banned') {
      const msg = settings.suspendedAccountMessage || 'Aapka account administrator dwara suspend kar diya gaya hai. Kripya admin se contact karein.';
      return res.status(403).json({
        success: false,
        accountStatus: 'suspended',
        message: msg
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        status: user.status,
        permissions: user.permissions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login'
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching user profile'
    });
  }
};

// @desc    Update current profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;
    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile'
    });
  }
};

// @desc    Update current user's password
// @route   PUT /api/auth/password
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current password and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating password'
    });
  }
};

// @desc    Forgot Password - Send reset link to email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // For security, don't leak user existence directly, but return informative message
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate random reset token (32 bytes = 64 hex chars)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token using sha256 to store in DB
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour valid
    await user.save({ validateBeforeSave: false });

    // Client URL (handles frontend origin)
    const clientOrigin = req.headers.origin || process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientOrigin}/reset-password/${resetToken}`;

    // Send email
    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
      resetToken
    });

    res.status(200).json({
      success: true,
      message: 'Password reset link has been dispatched to your email address.',
      devPreviewToken: process.env.NODE_ENV !== 'production' ? resetToken : undefined
    });
  } catch (error) {
    console.error('[forgotPassword Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error initiating password reset'
    });
  }
};

// @desc    Reset Password via Token
// @route   PUT /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a new password with at least 6 characters'
      });
    }

    // Hash the token from param to compare with DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired. Please request a new one.'
      });
    }

    // Set new password (pre-save hook will hash it)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been successfully updated! You can now sign in.'
    });
  } catch (error) {
    console.error('[resetPassword Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error resetting password'
    });
  }
};

