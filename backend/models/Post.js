const mongoose = require('mongoose');
const slugify = require('slugify');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: 'Untitled Post',
      trim: true
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true
    },
    excerpt: {
      type: String,
      default: ''
    },
    shortDescription: {
      type: String,
      default: ''
    },
    content: {
      type: String,
      default: '' // HTML / WYSIWYG rich text
    },
    featuredImage: {
      type: String,
      default: ''
    },
    displayContent: {
      type: Boolean,
      default: true
    },
    bannerMedia: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media',
      default: null
    },
    banner: {
      type: String,
      default: ''
    },
    bannerType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image'
    },
    bannerVideo: {
      type: String,
      default: ''
    },
    overlayStrength: {
      type: Number,
      default: 0
    },
    alignment: {
      type: String,
      enum: ['left', 'center', 'right'],
      default: 'left'
    },
    verticalPosition: {
      type: String,
      enum: ['top', 'center', 'bottom'],
      default: 'center'
    },
    bannerPosition: {
      type: String,
      default: 'center'
    },
    bannerHeight: {
      type: String,
      default: '50vh'
    },
    videoUrl: {
      type: String,
      default: ''
    },
    videoType: {
      type: String,
      enum: ['upload', 'media', 'url', 'none'],
      default: 'none'
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    childCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
      }
    ],
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    age: [
      {
        type: Number
      }
    ],
    maritalStatus: {
      type: String,
      enum: ['married', 'unmarried', 'any', ''],
      default: ''
    },
    status: {
      type: String,
      enum: ['published', 'draft', 'trash', 'archived'],
      default: 'published'
    },
    views: {
      type: Number,
      default: 0
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    featuredOnHomeBanner: {
      type: Boolean,
      default: false
    },
    screenOptions: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    layout: {
      type: String,
      enum: ['default', 'book'],
      default: 'default'
    },
    bookPaperColor: {
      type: String,
      default: '#fcfaf2'
    },
    bookCoverColor: {
      type: String,
      default: '#18181b'
    },
    bookTextColor: {
      type: String,
      default: '#2c2523'
    },
    bookFontFamily: {
      type: String,
      enum: ['serif', 'sans', 'literary'],
      default: 'serif'
    },
    bookPaperImage: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

postSchema.pre('save', async function () {
  if (this.slug) {
    this.slug = slugify(this.slug, { lower: true, strict: true });
  } else if (this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  // Auto-deduplicate slug: append -2, -3, etc. if slug already exists
  if (this.slug && this.isNew) {
    const baseSlug = this.slug;
    let candidate = baseSlug;
    let counter = 1;
    while (await mongoose.model('Post').findOne({ slug: candidate, _id: { $ne: this._id } })) {
      counter++;
      candidate = `${baseSlug}-${counter}`;
    }
    this.slug = candidate;
  }
});

module.exports = mongoose.model('Post', postSchema);
