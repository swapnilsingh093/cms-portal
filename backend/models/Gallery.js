const mongoose = require('mongoose');
const slugify = require('slugify');

const galleryImageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  caption: {
    type: String,
    default: ''
  },
  size: {
    type: Number,
    default: 0
  },
  order: {
    type: Number,
    default: 0
  }
});

const gallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: 'Untitled Gallery',
      trim: true
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true
    },
    description: {
      type: String,
      default: ''
    },
    shortDescription: {
      type: String,
      default: ''
    },
    displayContent: {
      type: Boolean,
      default: true
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
    bannerMedia: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media',
      default: null
    },
    coverImage: {
      type: String, // Album cover photo
      default: ''
    },
    images: [galleryImageSchema], // Array of uploaded photos
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
      enum: ['published', 'draft', 'trash', 'private'],
      default: 'published'
    },
    views: {
      type: Number,
      default: 0
    },
    layout: {
      type: String,
      enum: ['with_sidebar', 'without_sidebar'],
      default: 'with_sidebar'
    },
    showSidebar: {
      type: Boolean,
      default: true
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
    }
  },
  { timestamps: true }
);

gallerySchema.pre('save', async function () {
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
    while (await mongoose.model('Gallery').findOne({ slug: candidate, _id: { $ne: this._id } })) {
      counter++;
      candidate = `${baseSlug}-${counter}`;
    }
    this.slug = candidate;
  }
});

module.exports = mongoose.model('Gallery', gallerySchema);
