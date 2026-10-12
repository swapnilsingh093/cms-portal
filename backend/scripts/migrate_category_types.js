const mongoose = require('mongoose');
require('dotenv').config();

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  // Migrate videos
  const videos = await mongoose.connection.db.collection('videos').find({}).toArray();
  for (const v of videos) {
    const update = {};
    if (v.category && typeof v.category === 'string' && mongoose.Types.ObjectId.isValid(v.category)) {
      update.category = new mongoose.Types.ObjectId(v.category);
    }
    if (v.subCategory && typeof v.subCategory === 'string' && mongoose.Types.ObjectId.isValid(v.subCategory)) {
      update.subCategory = new mongoose.Types.ObjectId(v.subCategory);
    }
    if (Array.isArray(v.categories)) {
      update.categories = v.categories.map(c => typeof c === 'string' && mongoose.Types.ObjectId.isValid(c) ? new mongoose.Types.ObjectId(c) : c);
    }
    if (Object.keys(update).length > 0) {
      await mongoose.connection.db.collection('videos').updateOne({ _id: v._id }, { $set: update });
    }
  }
  console.log(`Migrated ${videos.length} videos`);

  // Migrate galleries
  const galleries = await mongoose.connection.db.collection('galleries').find({}).toArray();
  for (const g of galleries) {
    const update = {};
    if (g.category && typeof g.category === 'string' && mongoose.Types.ObjectId.isValid(g.category)) {
      update.category = new mongoose.Types.ObjectId(g.category);
    }
    if (g.subCategory && typeof g.subCategory === 'string' && mongoose.Types.ObjectId.isValid(g.subCategory)) {
      update.subCategory = new mongoose.Types.ObjectId(g.subCategory);
    }
    if (Array.isArray(g.categories)) {
      update.categories = g.categories.map(c => typeof c === 'string' && mongoose.Types.ObjectId.isValid(c) ? new mongoose.Types.ObjectId(c) : c);
    }
    if (Object.keys(update).length > 0) {
      await mongoose.connection.db.collection('galleries').updateOne({ _id: g._id }, { $set: update });
    }
  }
  console.log(`Migrated ${galleries.length} galleries`);

  await mongoose.disconnect();
}
migrate();
