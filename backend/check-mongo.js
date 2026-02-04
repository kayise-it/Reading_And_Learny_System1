// check-mongo.js
const { MongoClient } = require('mongodb');

async function checkMongoDB() {
    const uri = 'mongodb://localhost:27017';
    const client = new MongoClient(uri);
    
    console.log('🔍 Checking MongoDB connection...');
    
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB!');
        
        // List databases
        const adminDb = client.db().admin();
        const dbs = await adminDb.listDatabases();
        
        console.log('\n📊 Available databases:');
        dbs.databases.forEach(db => {
            console.log(`   - ${db.name}`);
        });
        
        // Check if our database exists
        const targetDb = 'reading_learning_db';
        const exists = dbs.databases.some(db => db.name === targetDb);
        console.log(`\n🎯 Database '${targetDb}' exists: ${exists ? '✅ Yes' : '❌ No'}`);
        
        if (exists) {
            const db = client.db(targetDb);
            const collections = await db.listCollections().toArray();
            console.log('\n📁 Collections:');
            collections.forEach(col => {
                console.log(`   - ${col.name}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n🔧 MongoDB is not running!');
            console.log('\nFix it:');
            console.log('1. Open Command Prompt as Administrator');
            console.log('2. Run: net start MongoDB');
            console.log('\nOr start it manually:');
            console.log('   "C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe"');
            console.log('\nOr use fallback server:');
            console.log('   node server-fallback.js');
        }
        
    } finally {
        await client.close();
    }
}

checkMongoDB();