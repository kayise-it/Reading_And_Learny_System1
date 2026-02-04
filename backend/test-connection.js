// test-connection.js
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/reading_learning_db';

async function testConnection() {
    console.log('Testing MongoDB connection...');
    console.log(`URI: ${MONGODB_URI}`);
    
    try {
        // Test connection without connecting to database
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 3000,
            connectTimeoutMS: 3000
        });
        
        console.log('✅ MongoDB connection successful!');
        
        // List databases
        const adminDb = mongoose.connection.db.admin();
        const result = await adminDb.listDatabases();
        console.log('\nAvailable databases:');
        result.databases.forEach(db => {
            console.log(`  - ${db.name}`);
        });
        
        // Check if our database exists
        const dbName = 'reading_learning_db';
        const exists = result.databases.some(db => db.name === dbName);
        console.log(`\nDatabase '${dbName}' exists: ${exists ? 'Yes' : 'No'}`);
        
        if (exists) {
            // List collections
            const collections = await mongoose.connection.db.listCollections().toArray();
            console.log('\nCollections in reading_learning_db:');
            collections.forEach(col => {
                console.log(`  - ${col.name}`);
            });
        }
        
        await mongoose.connection.close();
        console.log('\nTest completed successfully!');
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.log('\nPossible solutions:');
        console.log('1. Make sure MongoDB is installed');
        console.log('2. Start MongoDB service:');
        console.log('   - Open Command Prompt as Administrator');
        console.log('   - Run: net start MongoDB');
        console.log('3. Or start mongod.exe manually:');
        console.log('   - "C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe"');
        console.log('4. Use MongoDB Atlas instead:');
        console.log('   - Go to https://www.mongodb.com/cloud/atlas');
        console.log('   - Create free account');
        console.log('   - Get connection string');
    }
}

testConnection();