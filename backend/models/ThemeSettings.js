const mongoose = require('mongoose');

const themeSettingsSchema = new mongoose.Schema(
  {
    // General
    siteTitle: {
      type: String,
      default: 'My CMS Portal'
    },
    tagline: {
      type: String,
      default: 'Videos, Galleries & Stories'
    },
    siteUrl: {
      type: String,
      default: ''
    },
    adminEmail: {
      type: String,
      default: ''
    },

    // Appearance / Theme
    primaryColor: {
      type: String,
      default: '#2271b1'
    },
    accentColor: {
      type: String,
      default: '#135e96'
    },
    layout: {
      type: String,
      enum: ['standard', 'full-width', 'boxed'],
      default: 'standard'
    },
    fontFamily: {
      type: String,
      default: 'system'
    },
    darkModePublic: {
      type: Boolean,
      default: false
    },
    showAdminBar: {
      type: Boolean,
      default: true
    },
    headerLogo: {
      type: String,
      default: ''
    },
    favicon: {
      type: String,
      default: ''
    },

    // Extended Colors & Palette
    secondaryColor: {
      type: String,
      default: "#10b981"
    },
    backgroundColor: {
      type: String,
      default: "#0a0d14"
    },
    textColor: {
      type: String,
      default: "#e2e8f0"
    },
    headingColor: {
      type: String,
      default: "#ffffff"
    },
    linkColor: {
      type: String,
      default: "#3b82f6"
    },

    // Typography
    headingFont: {
      type: String,
      default: "system"
    },
    baseFontSize: {
      type: String,
      default: "16px"
    },
    headingScale: {
      type: String,
      default: "normal"
    },

    // Header Options
    headerBackground: {
      type: String,
      default: "#0d131f"
    },
    headerStyle: {
      type: String,
      default: "dark"
    },
    headerTextColor: {
      type: String,
      default: "#ffffff"
    },
    stickyHeader: {
      type: Boolean,
      default: true
    },
    headerHeight: {
      type: String,
      default: "72px"
    },

    // Footer Options
    footerBackground: {
      type: String,
      default: "#090e18"
    },
    footerTextColor: {
      type: String,
      default: "#94a3b8"
    },
    footerStyle: {
      type: String,
      default: "standard"
    },

    // Buttons & UI Options
    buttonBackground: {
      type: String,
      default: "#3b82f6"
    },
    buttonTextColor: {
      type: String,
      default: "#ffffff"
    },
    buttonBorderRadius: {
      type: String,
      default: "8px"
    },
    buttonStyle: {
      type: String,
      default: "solid"
    },

    // Membership & User Approval
    allowRegistration: {
      type: Boolean,
      default: false
    },
    defaultRole: {
      type: String,
      default: 'user'
    },
    requireEmailVerification: {
      type: Boolean,
      default: false
    },
    requireAdminApproval: {
      type: Boolean,
      default: true
    },
    pendingApprovalMessage: {
      type: String,
      default: 'Aapki registration request abhi pending hai. Administrator ke approve karne ke baad aap login kar sakenge.'
    },
    rejectedApprovalMessage: {
      type: String,
      default: 'Aapki registration request ko administrator dwara reject kar diya gaya hai. Kripya support se sampark karein.'
    },
    suspendedAccountMessage: {
      type: String,
      default: 'Aapka account administrator dwara suspend kar diya gaya hai. Kripya admin se contact karein.'
    },

    // Date & Time
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    dateFormat: {
      type: String,
      default: 'DD/MM/YYYY'
    },
    timeFormat: {
      type: String,
      default: '12h'
    },

    // Media & Uploads
    maxUploadSize: {
      type: String,
      default: '1024'
    },
    allowedImageTypes: {
      type: String,
      default: 'jpg,jpeg,png,webp,gif,svg,bmp,tiff'
    },
    allowedVideoTypes: {
      type: String,
      default: 'mp4,webm,mov,avi,mkv'
    },
    organizeByDate: {
      type: Boolean,
      default: true
    },
    generateThumbnails: {
      type: Boolean,
      default: true
    },

    // Reading
    postsPerPage: {
      type: Number,
      default: 10
    },
    excerptLength: {
      type: Number,
      default: 200
    },
    showFullPost: {
      type: Boolean,
      default: false
    },

    // SEO & Analytics
    metaDescription: {
      type: String,
      default: ''
    },
    googleAnalytics: {
      type: String,
      default: ''
    },
    facebookPixel: {
      type: String,
      default: ''
    },

    // Social Media Links
    socialFacebook: {
      type: String,
      default: ''
    },
    socialTwitter: {
      type: String,
      default: ''
    },
    socialInstagram: {
      type: String,
      default: ''
    },
    socialYoutube: {
      type: String,
      default: ''
    },
    socialWhatsapp: {
      type: String,
      default: ''
    },

    // Security
    maxLoginAttempts: {
      type: String,
      default: '5'
    },
    sessionTimeout: {
      type: String,
      default: '24'
    },
    enableCaptcha: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true, strict: false }
);

module.exports = mongoose.model('ThemeSettings', themeSettingsSchema);
