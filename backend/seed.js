const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Category = require('./models/Category');
const Video = require('./models/Video');
const Gallery = require('./models/Gallery');
const Post = require('./models/Post');
const Page = require('./models/Page');
const Menu = require('./models/Menu');

const seedData = async () => {
  try {
    let mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cms_portal';
    if (!mongoUri.startsWith('mongodb+srv://') && !mongoUri.includes('directConnection=')) {
      mongoUri += (mongoUri.includes('?') ? '&' : '?') + 'directConnection=true';
    }
    console.log(`Connecting to MongoDB for seeding: ${mongoUri.includes('@') ? mongoUri.split('@')[1] : mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany(),
      Category.deleteMany(),
      Video.deleteMany(),
      Gallery.deleteMany(),
      Post.deleteMany(),
      Page.deleteMany(),
      Menu.deleteMany()
    ]);

    console.log('🌱 Seeding Admin User...');
    const admin = await User.create({
      name: 'Super Admin',
      username: 'admin',
      email: 'admin@portal.com',
      password: 'admin123', // Will be hashed by User pre-save hook
      role: 'admin',
      bio: 'Administrator and Content Manager'
    });

    console.log('🌱 Seeding Categories & Hierarchical Sub-Categories...');
    // 1. Root Category: "Indian"
    const catIndian = await Category.create({
      name: 'Indian',
      description: 'Indian culture, content, media, and features',
      parentCategory: null,
      type: 'all',
      order: 1,
      banner: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&auto=format&fit=crop&q=80',
      thumbnail: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&auto=format&fit=crop&q=80'
    });

    // Sub-Categories under "Indian"
    const subCatUncle = await Category.create({
      name: 'Uncle',
      description: 'Uncle stories, videos, and highlights',
      parentCategory: catIndian._id, // Under Indian!
      type: 'video',
      order: 1,
      thumbnail: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80'
    });

    const subCatFestivals = await Category.create({
      name: 'Festivals',
      description: 'Festivals, traditions, and celebrations',
      parentCategory: catIndian._id,
      type: 'all',
      order: 2,
      thumbnail: 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?w=400&auto=format&fit=crop&q=80'
    });

    // 2. Root Category: "Travel & Life"
    const catTravel = await Category.create({
      name: 'Travel & Life',
      description: 'Scenic destinations, stories, and photography',
      parentCategory: null,
      type: 'all',
      order: 2,
      banner: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&auto=format&fit=crop&q=80',
      thumbnail: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&auto=format&fit=crop&q=80'
    });

    const subCatMountains = await Category.create({
      name: 'Mountains',
      description: 'Mountain peaks, trekking, and breathtaking trails',
      parentCategory: catTravel._id,
      type: 'all',
      order: 1,
      thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&auto=format&fit=crop&q=80'
    });

    console.log('🌱 Seeding Sample Videos...');
    await Video.create([
      {
        title: 'Traditional Folk Celebration & Uncle Story Episode 1',
        description: 'An inspiring showcase and traditional episode highlighting vibrant regional music and heartfelt stories.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        videoType: 'external',
        poster: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
        duration: '09:56',
        category: catIndian._id,
        subCategory: subCatUncle._id,
        categories: [catIndian._id, subCatUncle._id],
        tags: ['Indian', 'Uncle', 'Story', 'Folk'],
        status: 'published',
        views: 1420,
        author: admin._id,
        isFeatured: true
      },
      {
        title: 'Himalayan Ridge Expedition - 4K Nature Reel',
        description: 'A cinematic drone tour exploring the high-altitude peaks and serene landscapes.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        videoType: 'external',
        poster: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&auto=format&fit=crop&q=80',
        duration: '10:53',
        category: catTravel._id,
        subCategory: subCatMountains._id,
        categories: [catTravel._id, subCatMountains._id],
        tags: ['Travel', 'Mountains', 'Nature', 'Himalayas'],
        status: 'published',
        views: 3105,
        author: admin._id,
        isFeatured: true
      }
    ]);

    console.log('🌱 Seeding Photo Galleries...');
    await Gallery.create({
      title: 'Grand Festival of Colors & Joy',
      description: 'A vibrant photo series capturing high-energy festival moments and smiles.',
      coverImage: 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?w=1200&auto=format&fit=crop&q=80',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?w=800&auto=format&fit=crop&q=80',
          title: 'Morning Gathering',
          caption: 'Festive colors in the morning courtyard',
          order: 0
        },
        {
          url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&auto=format&fit=crop&q=80',
          title: 'Evening Lights',
          caption: 'Diyas and night lighting ceremony',
          order: 1
        },
        {
          url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
          title: 'Community Celebration',
          caption: 'Dancing and joyful moments',
          order: 2
        }
      ],
      category: catIndian._id,
      subCategory: subCatFestivals._id,
      categories: [catIndian._id, subCatFestivals._id],
      tags: ['Festivals', 'Celebration', 'Color'],
      status: 'published',
      views: 890,
      author: admin._id,
      isFeatured: true
    });

    console.log('🌱 Seeding Rich Posts / Stories...');
    await Post.create({
      title: 'The Timeless Magic of Community Stories',
      excerpt: 'Discover the ancient folklore and family tales passed down through generations.',
      content: `<h2>A Legacy of Storytelling</h2>
<p>From ancient gatherings around evening fires to modern digital spaces, storytelling remains the pulse of our communities.</p>
<p>In this featured piece, we explore the cultural roots, character journeys, and wisdom shared across generations.</p>
<blockquote>"A good story bridges centuries and speaks directly to the soul."</blockquote>
<h3>Why Community Narratives Matter</h3>
<ul>
  <li>Preservation of authentic heritage and dialect</li>
  <li>Connecting diaspora with regional roots</li>
  <li>Inspiring future creative voices</li>
</ul>`,
      featuredImage: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&auto=format&fit=crop&q=80',
      category: catIndian._id,
      subCategory: subCatUncle._id,
      categories: [catIndian._id, subCatUncle._id],
      tags: ['Heritage', 'Stories', 'Community'],
      status: 'published',
      views: 520,
      author: admin._id,
      isFeatured: true
    });

    console.log('🌱 Seeding Pages...');
    const aboutPage = await Page.create({
      title: 'About Us',
      slug: 'about-us',
      content: `<h2>Welcome to our Modern Media Portal</h2>
<p>We are a dedicated multimedia platform curating top-tier videos, rich photo galleries, and compelling editorial stories.</p>
<p>Our mission is to bring meaningful content, high visual quality, and effortless access to audiences worldwide.</p>`,
      banner: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&auto=format&fit=crop&q=80',
      status: 'published',
      order: 1
    });

    console.log('🌱 Seeding Header Navigation Menu...');
    await Menu.create({
      title: 'Main Header Navigation',
      location: 'header',
      isActive: true,
      items: [
        {
          title: 'Home',
          type: 'custom',
          url: '/',
          order: 0
        },
        {
          title: 'Indian',
          type: 'category',
          refId: catIndian._id,
          url: `/category/${catIndian.slug}`,
          order: 1,
          children: [
            {
              title: 'Uncle',
              type: 'subCategory',
              refId: subCatUncle._id,
              url: `/category/${subCatUncle.slug}`,
              order: 0
            },
            {
              title: 'Festivals',
              type: 'subCategory',
              refId: subCatFestivals._id,
              url: `/category/${subCatFestivals.slug}`,
              order: 1
            }
          ]
        },
        {
          title: 'Travel & Nature',
          type: 'category',
          refId: catTravel._id,
          url: `/category/${catTravel.slug}`,
          order: 2,
          children: [
            {
              title: 'Mountains',
              type: 'subCategory',
              refId: subCatMountains._id,
              url: `/category/${subCatMountains.slug}`,
              order: 0
            }
          ]
        },
        {
          title: 'About',
          type: 'page',
          refId: aboutPage._id,
          url: `/page/${aboutPage.slug}`,
          order: 3
        }
      ]
    });

    console.log('\n======================================================');
    console.log('🎉 Seed database completed successfully!');
    console.log('🔑 Admin Credentials:');
    console.log('   Email: admin@portal.com');
    console.log('   Password: admin123');
    console.log('======================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error.message);
    process.exit(1);
  }
};

seedData();
