const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const defaultEditorPermissions = {
  posts: { view: true, create: true, edit: true, delete: true },
  pages: { view: false, create: false, edit: false, delete: false },
  videos: { view: false, create: false, edit: false, delete: false },
  galleries: { view: false, create: false, edit: false, delete: false },
  media: { view: false, create: false, edit: false, delete: false },
  menus: { view: false, edit: false },
  theme: { view: false, edit: false },
  users: { view: false, edit: false },
  settings: { view: false, edit: false }
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter a name'],
      trim: true
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [
        /^[a-zA-Z0-9_.-]+$/,
        'Username can only contain letters, numbers, underscores, dots, or hyphens'
      ]
    },
    email: {
      type: String,
      required: [true, 'Please enter an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please enter a password'],
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: ['admin', 'editor', 'user'],
      default: 'user'
    },
    permissions: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ ...defaultEditorPermissions })
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'rejected', 'suspended', 'banned'],
      default: 'pending'
    },
    statusReason: {
      type: String,
      default: ''
    },
    avatar: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: ''
    },
    resetPasswordToken: {
      type: String,
      select: false
    },
    resetPasswordExpire: {
      type: Date,
      select: false
    }
  },
  { timestamps: true, minimize: false }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
