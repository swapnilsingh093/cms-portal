const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please log in first.'
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'cms_super_secret_jwt_key_2026'
    );

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      });
    }

    if (user.status === 'banned') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended by an administrator.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }
};

// Role-based access control (e.g., authorize('admin', 'editor'))
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user?.role || 'guest'}' is not authorized to access this resource.`
      });
    }
    next();
  };
};

/**
 * Granular module-level permission authorizer
 * - Admin always has unrestricted full access
 * - Editor permissions are checked dynamically
 * - If no permission explicitly set, default policy applies (Posts: full access, other modules: denied)
 */
const authorizePermission = (moduleName, action = 'view') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    // Super Admin always has full access to every module and action
    if (req.user.role === 'admin') {
      return next();
    }

    // Editor check
    if (req.user.role === 'editor') {
      const perms = req.user.permissions;

      // If user has no permissions stored yet, default policy: Posts allowed, others blocked
      if (!perms || typeof perms !== 'object') {
        if (moduleName === 'posts') {
          return next();
        }
        return res.status(403).json({
          success: false,
          message: `Access denied. Editor role is not authorized to ${action} ${moduleName}.`
        });
      }

      const modPerm = perms[moduleName];

      // If entire module is boolean
      if (typeof modPerm === 'boolean') {
        if (modPerm) return next();
        return res.status(403).json({
          success: false,
          message: `Access denied. Editor role is not authorized to ${action} ${moduleName}.`
        });
      }

      // If module permissions is an object with action keys (view, create, edit, delete)
      if (modPerm && typeof modPerm === 'object') {
        if (modPerm[action] === true || (action === 'view' && modPerm.view !== false)) {
          return next();
        }
        return res.status(403).json({
          success: false,
          message: `Access denied. You do not have permission to ${action} ${moduleName}.`
        });
      }

      // If posts module not explicitly configured, default allow for editor
      if (moduleName === 'posts') {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: `Access denied. Editor role is not authorized to ${action} ${moduleName}.`
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrator or Editor privileges required.'
    });
  };
};

const optionalAuth = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return next();
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'cms_super_secret_jwt_key_2026'
    );
    const user = await User.findById(decoded.id);
    if (user && user.status !== 'banned') {
      req.user = user;
    }
  } catch (e) {}
  next();
};

module.exports = { protect, authorize, authorizePermission, optionalAuth };
