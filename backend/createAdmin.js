// createAdmin.js - Run this once to create an admin user
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import the User model
const User = require('./middleware/models/User');

async function createAdmin() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/reading_learning_db');
    
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@system.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log('📧 Existing admin email:', existingAdmin.email);
      console.log('👤 Role:', existingAdmin.role);
      await mongoose.connection.close();
      return;
    }

    // Hash password (bcrypt hash for "admin123")
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const adminUser = new User({
      name: 'System Administrator',
      email: 'admin@system.com',
      password: hashedPassword,
      role: 'admin',
      grade: 'Admin',
      maxAttempts: 999,
      attemptsUsed: 0
    });

    await adminUser.save();
    console.log('\n✅ Admin user created successfully!');
    console.log('====================================');
    console.log('📧 Email: admin@system.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Name: System Administrator');
    console.log('🎯 Role: admin');
    console.log('📊 Max Attempts: 999');
    console.log('====================================');
    console.log('\n⚠️  IMPORTANT: Change this password immediately after first login!');

    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔍 Make sure MongoDB is running!');
      console.log('Start MongoDB with:');
      console.log('   mongod');
      console.log('Or check if MongoDB service is running.');
    }
    
    if (error.message.includes('Cannot find module')) {
      console.log('\n🔍 Could not find User model.');
      console.log('Make sure createAdmin.js is in the backend root directory.');
      console.log('Your directory structure should be:');
      console.log('  backend/');
      console.log('  ├── createAdmin.js');
      console.log('  ├── server.js');
      console.log('  └── middleware/');
      console.log('      └── models/');
      console.log('          └── User.js');
    }
    
    process.exit(1);
  }
}

// Run the function
createAdmin();