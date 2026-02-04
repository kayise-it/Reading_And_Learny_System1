// backend/createMigration.js - Run this once to add contentType to existing content
const mongoose = require('mongoose');
require('dotenv').config();

// Import the Content model
const Content = require('./middleware/models/Content');

async function migrateContentTypes() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/reading_learning_db');
    
    console.log('✅ Connected to MongoDB');
    console.log('🔄 Migrating content types...');
    
    // Get all content
    const allContent = await Content.find();
    
    console.log(`📚 Found ${allContent.length} content items to migrate`);
    
    let quizCount = 0;
    let notesCount = 0;
    let updatedCount = 0;
    
    for (const content of allContent) {
      let contentType = content.contentType;
      
      // If contentType doesn't exist or is empty, auto-detect
      if (!contentType) {
        if (content.questions && content.questions.length > 0) {
          contentType = 'quiz';
          quizCount++;
        } else {
          contentType = 'notes';
          notesCount++;
        }
        
        // Update the document
        await Content.findByIdAndUpdate(content._id, { contentType: contentType });
        updatedCount++;
      }
    }
    
    console.log('✅ Migration completed!');
    console.log(`📝 Quizzes: ${quizCount}`);
    console.log(`📚 Notes: ${notesCount}`);
    console.log(`🔄 Updated: ${updatedCount} documents`);
    console.log(`📊 Total: ${allContent.length} documents checked`);
    
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
}

// Run the migration
migrateContentTypes();