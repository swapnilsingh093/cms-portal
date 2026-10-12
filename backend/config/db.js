const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cms_portal';
    if (!mongoUri.startsWith('mongodb+srv://') && !mongoUri.includes('directConnection=')) {
      mongoUri += (mongoUri.includes('?') ? '&' : '?') + 'directConnection=true';
    }
    console.log(`Connecting to MongoDB at: ${mongoUri.includes('@') ? mongoUri.split('@')[1] : mongoUri}`);

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000 // 5 seconds timeout
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.log('\n💡 TIP: To use MongoDB Atlas (Cloud):');
    console.log('1. Open backend/.env');
    console.log('2. Set MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/cms_portal?retryWrites=true&w=majority');
    console.log('Or start local MongoDB with: mongod\n');
    return false;
  }
};

module.exports = connectDB;
