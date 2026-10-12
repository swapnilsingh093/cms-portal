const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const dumpDir = path.join(__dirname, '../database_dump');

const collectionsToRestore = [
  'users',
  'categories',
  'videos',
  'galleries',
  'posts',
  'pages',
  'menus',
  'themesettings',
  'media',
  'videofieldgroups'
];

const OBJECT_ID_KEYS = new Set([
  '_id',
  'category',
  'subCategory',
  'parentCategory',
  'author',
  'bannerMedia',
  'albumCoverMedia',
  'mediaId',
  'userId',
  'featuredMedia'
]);

function reviveObjectIds(obj, parentKey = '') {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => {
      if (
        (parentKey === 'categories' || parentKey.endsWith('Ids')) &&
        typeof item === 'string' &&
        /^[0-9a-fA-F]{24}$/.test(item)
      ) {
        return new mongoose.Types.ObjectId(item);
      }
      return reviveObjectIds(item, parentKey);
    });
  }
  if (typeof obj !== 'object') return obj;

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === 'object') {
      if (value.$oid && typeof value.$oid === 'string') {
        result[key] = new mongoose.Types.ObjectId(value.$oid);
      } else if (value.$date) {
        result[key] = new Date(value.$date);
      } else {
        result[key] = reviveObjectIds(value, key);
      }
    } else if (
      (OBJECT_ID_KEYS.has(key) || key.endsWith('Id') || key.endsWith('ID')) &&
      typeof value === 'string' &&
      /^[0-9a-fA-F]{24}$/.test(value)
    ) {
      result[key] = new mongoose.Types.ObjectId(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

async function restoreDatabase(force = false) {
  let mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cms_portal';
  if (!mongoUri.startsWith('mongodb+srv://') && !mongoUri.includes('directConnection=')) {
    mongoUri += (mongoUri.includes('?') ? '&' : '?') + 'directConnection=true';
  }
  console.log(`Connecting to MongoDB for restore: ${mongoUri.includes('@') ? mongoUri.split('@')[1] : mongoUri}`);

  await mongoose.connect(mongoUri);

  if (!fs.existsSync(dumpDir)) {
    console.error(`❌ Dump directory not found at: ${dumpDir}`);
    process.exit(1);
  }

  for (const collName of collectionsToRestore) {
    const filePath = path.join(dumpDir, `${collName}.json`);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ Skipping ${collName}: ${collName}.json not found`);
      continue;
    }

    try {
      const coll = mongoose.connection.collection(collName);
      const currentCount = await coll.countDocuments();

      if (currentCount > 0 && !force) {
        console.log(`ℹ️ Collection ${collName} already has ${currentCount} docs. Skipping (use force=true to overwrite).`);
        continue;
      }

      if (force && currentCount > 0) {
        if (collName === 'categories') {
          await coll.dropIndex('slug_1').catch(() => {});
        }
        await coll.deleteMany({});
        console.log(`🧹 Cleared existing ${currentCount} docs in ${collName}`);
      }

      const raw = fs.readFileSync(filePath, 'utf-8');
      const docs = JSON.parse(raw);

      if (docs && docs.length > 0) {
        const transformedDocs = docs.map(reviveObjectIds);
        await coll.insertMany(transformedDocs, { ordered: false });
        console.log(`✅ Restored ${collName}: ${docs.length} documents.`);
      } else {
        console.log(`ℹ️ ${collName}.json is empty. No documents to insert.`);
      }
    } catch (err) {
      console.error(`❌ Error restoring collection ${collName}:`, err.message);
    }
  }

  console.log(`\n🎉 Database restore completed successfully!`);
  await mongoose.disconnect();
  return true;
}

if (require.main === module) {
  const force = process.argv.includes('--force') || process.argv.includes('-f');
  restoreDatabase(force)
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal restore error:', err);
      process.exit(1);
    });
}

module.exports = restoreDatabase;
