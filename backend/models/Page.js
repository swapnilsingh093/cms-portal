const mongoose = require('mongoose');
const slugify = require('slugify');

const pageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: 'Untitled Page',
      trim: true
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true
    },
    content: {
      type: String,
      default: '' // HTML rich content
    },
    banner: {
      type: String,
      default: ''
    },
    template: {
      type: String,
      enum: ['default', 'full-width', 'contact', 'home', 'landing', 'videos', 'galleries', 'posts', 'stories', 'search-by-video'],
      default: 'default'
    },
    status: {
      type: String,
      enum: ['published', 'draft', 'trash'],
      default: 'published'
    },
    order: {
      type: Number,
      default: 0
    },
    metaTitle: {
      type: String,
      default: ''
    },
    metaDescription: {
      type: String,
      default: ''
    },
    templateConfig: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

pageSchema.pre('save', async function () {
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
    while (await mongoose.model('Page').findOne({ slug: candidate, _id: { $ne: this._id } })) {
      counter++;
      candidate = `${baseSlug}-${counter}`;
    }
    this.slug = candidate;
  }
});

module.exports = mongoose.model('Page', pageSchema);
