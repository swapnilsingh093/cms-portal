const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['category', 'subCategory', 'page', 'custom', 'post', 'video', 'gallery'],
    default: 'custom'
  },
  refId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  url: {
    type: String,
    default: '/'
  },
  target: {
    type: String,
    enum: ['_self', '_blank'],
    default: '_self'
  },
  order: {
    type: Number,
    default: 0
  },
  children: [
    {
      title: String,
      type: {
        type: String,
        enum: ['category', 'subCategory', 'page', 'custom', 'post', 'video', 'gallery'],
        default: 'custom'
      },
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
      },
      url: String,
      target: {
        type: String,
        enum: ['_self', '_blank'],
        default: '_self'
      },
      order: {
        type: Number,
        default: 0
      }
    }
  ]
});

const menuSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a menu title'],
      trim: true
    },
    location: {
      type: String,
      enum: ['header', 'footer', 'sidebar'],
      default: 'header'
    },
    items: [menuItemSchema],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Menu', menuSchema);
