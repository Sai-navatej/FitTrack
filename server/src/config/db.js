const mongoose = require('mongoose');

let mongoMemoryServer = null;

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;

    if (!mongoUri || mongoUri.trim() === '') {
      console.log('ℹ️ No MONGODB_URI provided in environment. Starting embedded MongoDB Memory Server for local development...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongoMemoryServer = await MongoMemoryServer.create();
        mongoUri = mongoMemoryServer.getUri();
        console.log(`✅ Embedded MongoDB Memory Server started successfully at: ${mongoUri}`);
      } catch (err) {
        console.warn('⚠️ Could not start mongodb-memory-server, attempting localhost fallback:', err.message);
        mongoUri = 'mongodb://127.0.0.1:27017/fittrack';
      }
    }

    const conn = await mongoose.connect(mongoUri, {
      autoIndex: true,
    });

    console.log(`🚀 MongoDB Connected: ${conn.connection.host} (DB: ${conn.connection.name})`);

    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
    console.log('MongoDB disconnected successfully');
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error);
  }
};

module.exports = { connectDB, disconnectDB };
