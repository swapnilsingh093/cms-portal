const User = require('../models/User');
const Post = require('../models/Post');
const Video = require('../models/Video');
const Gallery = require('../models/Gallery');

// @desc    Get all users (with search and role filter, plus post counts)
// @route   GET /api/users
// @access  Private (Admin)
exports.getUsers = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 15 } = req.query;
    let query = {};

    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const userIds = users.map(u => u._id);

    // Aggregate posts, videos, galleries counts for each user (WordPress-style)
    const [postCounts, videoCounts, galleryCounts] = await Promise.all([
      Post.aggregate([
        { $match: { author: { $in: userIds }, status: { $ne: 'trash' } } },
        { $group: { _id: '$author', count: { $sum: 1 } } }
      ]),
      Video.aggregate([
        { $match: { author: { $in: userIds }, status: { $ne: 'trash' } } },
        { $group: { _id: '$author', count: { $sum: 1 } } }
      ]),
      Gallery.aggregate([
        { $match: { author: { $in: userIds }, status: { $ne: 'trash' } } },
        { $group: { _id: '$author', count: { $sum: 1 } } }
      ])
    ]);

    const postMap = {};
    postCounts.forEach(item => { postMap[String(item._id)] = item.count; });
    const videoMap = {};
    videoCounts.forEach(item => { videoMap[String(item._id)] = item.count; });
    const galleryMap = {};
    galleryCounts.forEach(item => { galleryMap[String(item._id)] = item.count; });

    const usersWithCounts = users.map(u => {
      const pCount = postMap[String(u._id)] || 0;
      const vCount = videoMap[String(u._id)] || 0;
      const gCount = galleryMap[String(u._id)] || 0;
      return {
        ...u,
        postsCount: pCount,
        videosCount: vCount,
        galleriesCount: gCount,
        totalContentCount: pCount + vCount + gCount
      };
    });

    res.json({
      success: true,
      count: usersWithCounts.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)) || 1,
      users: usersWithCounts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching users'
    });
  }
};

// @desc    Get list of authors for assignment dropdown
// @route   GET /api/users/authors
// @access  Private
exports.getAuthors = async (req, res) => {
  try {
    // Only active Admins and Editors can be assigned as authors (no pending, suspended, banned, or subscribers)
    const authors = await User.find({
      role: { $in: ['admin', 'editor'] },
      status: 'active'
    })
      .select('name username email avatar role status')
      .sort({ role: 1, name: 1 })
      .lean();

    res.json({
      success: true,
      authors,
      users: authors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching authors'
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Admin)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user'
    });
  }
};

// @desc    Create new user by admin
// @route   POST /api/users
// @access  Private (Admin)
exports.createUser = async (req, res) => {
  try {
    const { name, username, email, password, role, status, permissions } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
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
        message: 'A user with this email already exists'
      });
    }

    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'A user with this username already exists'
      });
    }

    const user = await User.create({
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      password,
      role: role || 'user',
      status: status || 'active',
      permissions
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully!',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        permissions: user.permissions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating user'
    });
  }
};

// @desc    Update user (role, status, name, email, password, etc.)
// @route   PUT /api/users/:id
// @access  Private (Admin)
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { name, username, email, role, status, password, bio, avatar, permissions, statusReason } = req.body;

    if (name) user.name = name.trim();

    if (username && username.trim().toLowerCase() !== user.username) {
      const cleanUsername = username.trim().toLowerCase();
      if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(cleanUsername)) {
        return res.status(400).json({
          success: false,
          message: 'Username must be between 3 and 30 characters (alphanumeric, dots, hyphens, underscores)'
        });
      }
      const usernameExists = await User.findOne({
        username: cleanUsername,
        _id: { $ne: user._id }
      });
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: 'A user with this username already exists.'
        });
      }
      user.username = cleanUsername;
    }

    if (email && email.toLowerCase() !== user.email) {
      const cleanEmail = email.trim().toLowerCase();
      const emailExists = await User.findOne({
        email: cleanEmail,
        _id: { $ne: user._id }
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'A user with this email address already exists.'
        });
      }
      user.email = cleanEmail;
    }

    if (role) user.role = role;
    if (status) user.status = status;
    if (password && password.trim()) user.password = password; // will be hashed by pre-save hook
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    if (permissions !== undefined) user.permissions = permissions;
    if (statusReason !== undefined) user.statusReason = statusReason;

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        statusReason: user.statusReason,
        permissions: user.permissions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating user'
    });
  }
};

// @desc    Approve user registration
// @route   PUT /api/users/:id/approve
// @access  Private (Admin)
exports.approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.status = 'active';
    user.statusReason = '';
    await user.save();

    res.json({
      success: true,
      message: `User ${user.name} approved successfully!`,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error approving user'
    });
  }
};

// @desc    Reject user registration
// @route   PUT /api/users/:id/reject
// @access  Private (Admin)
exports.rejectUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.status = 'rejected';
    if (req.body.reason) user.statusReason = req.body.reason;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.name} registration has been rejected.`,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error rejecting user'
    });
  }
};

// @desc    Toggle user suspension (active <-> suspended)
// @route   PUT /api/users/:id/suspend
// @access  Private (Admin)
exports.toggleSuspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot suspend your own admin account.'
      });
    }

    const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
    user.status = newStatus;
    if (req.body.reason !== undefined) user.statusReason = req.body.reason;
    await user.save();

    res.json({
      success: true,
      message: newStatus === 'suspended' ? `Account for ${user.name} is now suspended.` : `Account for ${user.name} has been activated.`,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error toggling user suspension'
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting self
    if (req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account.'
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting user'
    });
  }
};
