const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const dumpDir = path.join(__dirname, '../database_dump');

const collectionsToDump = [
  'pages',
  'categories',
  'videos',
  'galleries',
  'posts',
  'users',
  'menus',
  'themesettings',
  'media',
  'videofieldgroups'
];

async function dumpDatabase() {
  let mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cms_portal';
  if (!mongoUri.startsWith('mongodb+srv://') && !mongoUri.includes('directConnection=')) {
    mongoUri += (mongoUri.includes('?') ? '&' : '?') + 'directConnection=true';
  }
  console.log(`Connecting to MongoDB at: ${mongoUri.includes('@') ? mongoUri.split('@')[1] : mongoUri}`);

  await mongoose.connect(mongoUri);

  if (!fs.existsSync(dumpDir)) {
    fs.mkdirSync(dumpDir, { recursive: true });
  }

  console.log(`📦 Starting full database dump into: ${dumpDir}`);

  for (const collName of collectionsToDump) {
    try {
      const coll = mongoose.connection.collection(collName);
      const docs = await coll.find({}).toArray();
      const filePath = path.join(dumpDir, `${collName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf-8');
      console.log(`✅ Exported ${collName}: ${docs.length} documents -> ${collName}.json`);
    } catch (err) {
      console.error(`❌ Failed to dump collection ${collName}:`, err.message);
    }
  }

  // Also write metadata timestamp
  fs.writeFileSync(
    path.join(dumpDir, 'dump_meta.json'),
    JSON.stringify({
      exportedAt: new Date().toISOString(),
      sourceDb: mongoose.connection.name,
      collections: collectionsToDump
    }, null, 2),
    'utf-8'
  );

  console.log(`\n🎉 Full database dump completed successfully!`);
  await mongoose.disconnect();
  process.exit(0);
}

dumpDatabase().catch(err => {
  console.error('Fatal dump error:', err);
  process.exit(1);
});
