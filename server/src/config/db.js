const dns = require('node:dns');
try {
  // Use public DNS resolvers for reliable MongoDB Atlas SRV lookups on Windows
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // ignore in sandboxed environments if not permitted
}
const mongoose = require('mongoose');

let mongoMemoryServer = null;

// Helper to sanitize connection string for logs (safely masks credentials)
const sanitizeMongoUri = (uri) => {
  if (!uri) return '';
  return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@.+)/i, '$1********$3');
};

// Check if database is currently connected
const isDatabaseConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Setup runtime connection event listeners
const setupConnectionEvents = () => {
  mongoose.connection.on('connected', () => {
    console.log(`✅ MongoDB Mongoose connection established.`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn(`⚠️ MongoDB connection disconnected! Requests requiring database access will fail.`);
  });

  mongoose.connection.on('reconnected', () => {
    console.log(`🔄 MongoDB reconnected successfully.`);
  });

  mongoose.connection.on('error', (err) => {
    console.error(`❌ MongoDB runtime error: ${err.message}`);
  });
};

// One-time initialization of connection events
let eventsConfigured = false;

const connectDB = async () => {
  if (!eventsConfigured) {
    setupConnectionEvents();
    eventsConfigured = true;
  }

  const mongoUri = process.env.MONGODB_URI;

  // 1. Explicit in-memory mode ONLY for isolated automated tests if explicitly requested
  if (process.env.NODE_ENV === 'test' && (!mongoUri || process.env.USE_IN_MEMORY_DB === 'true')) {
    console.log('🧪 [Test Mode] Launching isolated in-memory test database...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoMemoryServer = await MongoMemoryServer.create();
    const testUri = mongoMemoryServer.getUri();
    const conn = await mongoose.connect(testUri, { autoIndex: true });
    console.log(`🧪 Test In-Memory MongoDB Connected: ${conn.connection.name}`);
    return conn;
  }

  // 2. Normal runtime: MONGODB_URI is strictly required
  if (!mongoUri || mongoUri.trim() === '') {
    console.error('\n======================================================');
    console.error('❌ FATAL: Missing MongoDB Atlas Connection String!');
    console.error('======================================================');
    console.error('FitTrack requires a valid MongoDB connection string to operate.');
    console.error('Silent fallback to in-memory storage is disabled in development and production.');
    console.error('\nTo configure your database:');
    console.error('1. Create or open server/.env');
    console.error('2. Add your MongoDB Atlas connection string:');
    console.error('   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/fittrack?retryWrites=true&w=majority');
    console.error('3. Ensure your current IP is whitelisted in MongoDB Atlas Network Access.');
    console.error('======================================================\n');
    throw new Error('MONGODB_URI environment variable is required.');
  }

  try {
    console.log(`📡 Connecting to MongoDB Atlas: ${sanitizeMongoUri(mongoUri)}...`);
    const conn = await mongoose.connect(mongoUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`🚀 MongoDB Atlas Connected Successfully!`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`\n❌ MongoDB Atlas Connection Failed!`);
    if (error.name === 'MongoServerSelectionError') {
      console.error('👉 Diagnostic: Unable to reach MongoDB Atlas cluster.');
      console.error('   1. Check your IP Whitelist in MongoDB Atlas (Network Access -> Add IP Address / 0.0.0.0/0 for testing).');
      console.error('   2. Verify your internet connection and Atlas cluster status.');
    } else if (
      error.codeName === 'AtlasError' ||
      error.message.includes('bad auth') ||
      error.message.includes('authentication failed')
    ) {
      console.error('👉 Diagnostic: MongoDB Atlas Authentication Failed.');
      console.error('   1. Verify your database username and password in server/.env.');
      console.error('   2. If password contains special characters like @, #, $, %, ensure they are URL-encoded.');
    } else {
      console.error(`👉 Diagnostic details: ${error.message}`);
    }
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
      mongoMemoryServer = null;
    }
    console.log('MongoDB connection closed gracefully.');
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error.message);
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  sanitizeMongoUri,
  isDatabaseConnected,
};

