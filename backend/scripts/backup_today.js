const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

// Today's date in YYYY-MM-DD format
const todayStr = new Date().toISOString().slice(0, 10);
const folderName = `database_backup_${todayStr}`;
const backupDir = path.join(__dirname, '..', folderName);
const rootBackupDir = path.join(__dirname, '../..', folderName);

async function runBackup() {
  let mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cms_portal';
  if (!mongoUri.startsWith('mongodb+srv://') && !mongoUri.includes('directConnection=')) {
    mongoUri += (mongoUri.includes('?') ? '&' : '?') + 'directConnection=true';
  }

  console.log(`Connecting to MongoDB at: ${mongoUri.includes('@') ? mongoUri.split('@')[1] : mongoUri}`);
  await mongoose.connect(mongoUri);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const collections = await mongoose.connection.db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);

  console.log(`📦 Starting full database backup into folder: ${folderName}`);
  console.log(`Found collections: ${collectionNames.join(', ')}`);

  const summary = {};

  for (const collName of collectionNames) {
    try {
      const coll = mongoose.connection.collection(collName);
      const docs = await coll.find({}).toArray();
      const filePath = path.join(backupDir, `${collName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf-8');
      summary[collName] = docs.length;
      console.log(`✅ Backed up ${collName}: ${docs.length} documents -> ${collName}.json`);
    } catch (err) {
      console.error(`❌ Failed to backup collection ${collName}:`, err.message);
    }
  }

  const meta = {
    backupDate: todayStr,
    timestamp: new Date().toISOString(),
    sourceDatabase: mongoose.connection.name,
    collections: summary,
    totalCollections: collectionNames.length,
    totalDocuments: Object.values(summary).reduce((a, b) => a + b, 0)
  };

  fs.writeFileSync(
    path.join(backupDir, 'backup_meta.json'),
    JSON.stringify(meta, null, 2),
    'utf-8'
  );

  console.log(`\n🎉 Full database backup completed successfully into ${backupDir}!`);
  console.log('Summary:', meta);

  await mongoose.disconnect();
  process.exit(0);
}

runBackup().catch(err => {
  console.error('Fatal backup error:', err);
  process.exit(1);
});
