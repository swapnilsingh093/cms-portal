const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide category name'],
      trim: true
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    shortDescription: {
      type: String,
      default: ''
    },
    bannerType: {
      type: String,
      enum: ['video', 'image'],
      default: 'image'
    },
    bannerVideo: {
      type: String,
      default: ''
    },
    bannerImage: {
      type: String,
      default: ''
    },
    overlayStrength: {
      type: Number,
      default: 0
    },
    bannerPosition: {
      type: String,
      default: 'center'
    },
    layout: {
      type: String,
      enum: ['with_sidebar', 'without_sidebar'],
      default: 'with_sidebar'
    },
    // Media display settings (per-category, similar to Video Page template config)
    mediaHeight: {
      type: String,
      default: '60vh'
    },
    headingFontSize: {
      type: String,
      default: '2.5rem'
    },
    subheadingFontSize: {
      type: String,
      default: '1.1rem'
    },
    descriptionFontSize: {
      type: String,
      default: '1rem'
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
    buttonText: {
      type: String,
      default: ''
    },
    buttonUrl: {
      type: String,
      default: ''
    },
    buttonFontSize: {
      type: String,
      default: '0.95rem'
    },
    // If parentCategory is null => Root / Main Category (e.g. "Indian")
    // If parentCategory is an ID => Sub-Category under that parent (e.g. "Uncle" under "Indian")
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    thumbnail: {
      type: String,
      default: ''
    },
    banner: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      enum: ['all', 'video', 'gallery', 'post'],
      default: 'all'
    },
    order: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'visible'],
      default: 'active'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound unique index: slug is unique per taxonomy type (e.g. "uncle" can exist in video, post, and gallery independently)
categorySchema.index({ slug: 1, type: 1 }, { unique: true });

// Auto-generate slug before save if not provided
categorySchema.pre('save', async function () {
  if (!this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  // Auto-deduplicate slug: append -2, -3, etc. only if slug already exists within the SAME taxonomy type
  if (this.slug && this.isNew) {
    const rootSlug = this.slug.replace(/-\d+$/, '');
    let candidate = this.slug;
    let counter = 1;
    while (await mongoose.model('Category').findOne({ slug: candidate, type: this.type, _id: { $ne: this._id } })) {
      counter++;
      candidate = `${rootSlug}-${counter}`;
    }
    this.slug = candidate;
  }
});

// Virtual for sub-categories
categorySchema.virtual('subCategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory'
});

module.exports = mongoose.model('Category', categorySchema);
