const mongoose = require('mongoose');
const slugify = require('slugify');

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: 'Untitled Video',
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
    descriptionPosition: {
      type: String,
      enum: ['no', 'before', 'after'],
      default: 'after'
    },
    videoUrl: {
      type: String,
      default: ''
    },
    videoType: {
      type: String,
      enum: ['upload', 'youtube', 'vimeo', 'external'],
      default: 'upload'
    },
    displayContent: {
      type: Boolean,
      default: true
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
    poster: {
      type: String, // Banner / Poster image URL
      default: ''
    },
    thumbnail: {
      type: String, // Card preview thumbnail URL
      default: ''
    },
    duration: {
      type: String, // e.g. "14:20"
      default: ''
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category', // Main parent category (e.g., "Indian")
      default: null
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category', // Sub category (e.g., "Uncle")
      default: null
    },
    childCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category', // Child category (Level 3)
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
    choiceCategory: [
      {
        type: String,
        trim: true
      }
    ],
    ageGroup: {
      type: String,
      default: ''
    },
    maritalStatus: {
      type: String,
      default: ''
    },
    customFields: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
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
    likes: {
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
    }
  },
  { timestamps: true }
);

videoSchema.pre('save', async function () {
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
    while (await mongoose.model('Video').findOne({ slug: candidate, _id: { $ne: this._id } })) {
      counter++;
      candidate = `${baseSlug}-${counter}`;
    }
    this.slug = candidate;
  }
});

module.exports = mongoose.model('Video', videoSchema);
