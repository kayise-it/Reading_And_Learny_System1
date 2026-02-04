// middleware/contentRoutes.js
const express = require('express');
const router = express.Router();
const Content = require("./models/Content");
const { authMiddleware } = require('./auth');

// Get content by grade and type
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { grade, contentType } = req.query;
        
        let query = {};
        if (grade) {
            query.grade = grade;
        }
        
        // Filter by content type if specified
        if (contentType && ['quiz', 'notes'].includes(contentType)) {
            query.contentType = contentType;
        }
        
        const content = await Content.find(query).sort({ createdAt: -1 });
        res.json(content);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new content (admin only)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const content = new Content(req.body);
        await content.save();
        
        res.status(201).json({
            success: true,
            message: 'Content created successfully',
            content: content
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

module.exports = router;