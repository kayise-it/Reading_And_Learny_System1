// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

// Import routes
const authRoutes = require('./middleware/authRoutes');
const contentRoutes = require('./middleware/contentRoutes');
const submissionRoutes = require('./middleware/submissionRoutes');
const adminRoutes = require('./middleware/adminRoutes');

const app = express();
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Length']
}));

app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/reading_learning_db';

// Connect to MongoDB
async function connectDB() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        console.log(`📁 Database: reading_learning_db`);
        
        await mongoose.connect(MONGODB_URI);
        
        console.log('✅ MongoDB connected successfully!');
        console.log(`📊 Connected to: ${mongoose.connection.name}`);
        console.log(`🏠 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
        
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        
        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n🔍 MongoDB is not running!');
            console.log('Start it with:');
            console.log('   "C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe"');
        }
        
        process.exit(1);
    }
}
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/admin', adminRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'Reading & Learning API',
        status: 'running',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        cors: 'enabled for all origins',
        endpoints: {
            auth: '/api/auth',
            content: '/api/content',
            submissions: '/api/submissions',
            admin: '/api/admin'
        }
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState;
    const status = dbStatus === 1 ? 'healthy' : 'unhealthy';
    
    res.json({
        status: status,
        database: dbStatus === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        requested_url: req.originalUrl,
        method: req.method,
        available_endpoints: {
            auth: {
                login: 'POST /api/auth/login',
                register: 'POST /api/auth/register',
                profile: 'GET /api/auth/profile'
            },
            content: {
                list: 'GET /api/content',
                create: 'POST /api/content'
            },
            submissions: {
                submit: 'POST /api/submissions/submit-quiz',
                student: 'GET /api/submissions/student/:studentId',
                admin: 'GET /api/submissions/admin/submissions'
            },
            admin: {
                users: 'GET /api/admin/users',
                content: 'GET /api/admin/content',
                deleteUser: 'DELETE /api/admin/users/:userId',
                resetAttempts: 'POST /api/admin/users/:userId/reset-attempts'
            }
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// Start server
const PORT = process.env.PORT || 4000;

async function startServer() {
    await connectDB();
    
    // Check for JWT_SECRET
    if (!process.env.JWT_SECRET) {
        console.error('❌ FATAL ERROR: JWT_SECRET is not defined in .env file');
        console.log('\nCreate a .env file with:');
        console.log('JWT_SECRET=your_super_secret_jwt_key_change_this');
        process.exit(1);
    }

    // Create indexes if needed
    await createIndexes();
    
    app.listen(PORT, () => {
        console.log(`\n🚀 Server running on port ${PORT}`);
        console.log(`🌐 URL: http://localhost:${PORT}`);
        console.log(`✅ CORS: Enabled for ALL origins (development mode)`);
        console.log(`📊 Health: http://localhost:${PORT}/health`);
        console.log(`🔑 Auth API: http://localhost:${PORT}/api/auth`);
        console.log(`\n📋 Test with curl:`);
        console.log('curl -X POST http://localhost:4000/api/auth/register \\');
        console.log('  -H "Content-Type: application/json" \\');
        console.log('  -d \'{"name":"Test","email":"test@test.com","password":"test123","grade":"Grade 4"}\'');
    });
}

// Create database indexes
async function createIndexes() {
    try {
        const db = mongoose.connection.db;
        
        // Create indexes for better performance
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('submissions').createIndex({ studentId: 1, submittedAt: -1 });
        await db.collection('contents').createIndex({ grade: 1, subject: 1 });
        
        console.log('✅ Database indexes created');
    } catch (error) {
        console.log('⚠️  Could not create indexes:', error.message);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Server terminated');
    await mongoose.connection.close();
    process.exit(0);
});

startServer();