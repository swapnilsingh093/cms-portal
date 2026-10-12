const mongoose = require('mongoose');

const videoFieldGroupSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Field title is required'],
      trim: true
    },
    key: {
      type: String,
      required: [true, 'Field key is required'],
      trim: true,
      unique: true,
      lowercase: true
    },
    type: {
      type: String,
      enum: ['checkbox', 'radio', 'select', 'text'],
      default: 'checkbox'
    },
    options: [
      {
        type: String,
        trim: true
      }
    ],
    placeholder: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    order: {
      type: Number,
      default: 0
    },
    isSystem: {
      type: Boolean,
      default: false
    },
    showInSearch: {
      type: Boolean,
      default: true
    },
    showInEditor: {
      type: Boolean,
      default: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('VideoFieldGroup', videoFieldGroupSchema);
