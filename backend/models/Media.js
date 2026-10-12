const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    extension: {
      type: String,
      default: ''
    },
    size: {
      type: Number,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    thumbnail: {
      type: String,
      default: ''
    },
    mediaType: {
      type: String,
      enum: ['image', 'video', 'document', 'other'],
      default: 'image'
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    altText: {
      type: String,
      default: ''
    },
    caption: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Media', mediaSchema);
