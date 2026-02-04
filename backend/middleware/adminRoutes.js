// middleware/adminRoutes.js
const express = require('express');
const router = express.Router();
const User = require("./models/User");
const Content = require("./models/Content");
const Submission = require("./models/Submission");
const { authMiddleware, adminMiddleware } = require('./auth');

// Apply both auth and admin middleware to all admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

// ========== ADMIN ROUTES ==========

// 1. GET all users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. GET all content
router.get('/content', async (req, res) => {
    try {
        const content = await Content.find().sort({ createdAt: -1 });
        res.json(content);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. DELETE content - FIXED ROUTE DEFINITION
router.delete('/content/:contentId', async (req, res) => {
    try {
        const { contentId } = req.params;
        
        console.log(`🗑️ Attempting to delete content: ${contentId}`);
        
        // Check if content exists
        const content = await Content.findById(contentId);
        if (!content) {
            console.log(`❌ Content not found: ${contentId}`);
            return res.status(404).json({ 
                success: false,
                message: 'Content not found' 
            });
        }

        // Delete the content
        await Content.findByIdAndDelete(contentId);
        
        console.log(`✅ Content deleted: ${contentId}`);
        
        res.json({ 
            success: true,
            message: 'Content deleted successfully' 
        });
    } catch (error) {
        console.error('❌ Delete content error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// 4. DELETE user
router.delete('/users/:userId', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.userId);
        res.json({ 
            success: true,
            message: 'User deleted successfully' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// 5. Reset user attempts
router.post('/users/:userId/reset-attempts', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.userId,
            { attemptsUsed: 0 },
            { new: true }
        ).select('-password');
        
        res.json({ 
            success: true,
            message: 'Attempts reset successfully',
            user 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

module.exports = router;