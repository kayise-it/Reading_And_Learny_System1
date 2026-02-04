// middleware/submissionRoutes.js
const express = require('express');
const router = express.Router();
const Submission = require("./models/Submission");
const Content = require("./models/Content");
const User = require("./models/User");
const { authMiddleware } = require('./auth');
// Submit a quiz
router.post('/submit-quiz', authMiddleware, async (req, res) => {
    try {
        const { contentId, answers } = req.body;
        const userId = req.userId;
        
        // Get content
        const content = await Content.findById(contentId);
        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }
        
        // Calculate score
        let score = 0;
        const review = content.questions.map((question, index) => {
            const selected = answers[index] || '';
            const correct = selected === question.answer;
            if (correct) score++;
            
            return {
                question: question.question,
                selected: selected,
                correctAnswer: question.answer,
                correct: correct
            };
        });
        
        // Create submission
        const submission = new Submission({
            studentId: userId,
            contentId: contentId,
            score: score,
            total: content.questions.length,
            answers: review,
            submittedAt: new Date()
        });
        
        await submission.save();
        
        // Update user attempts
        await User.findByIdAndUpdate(userId, {
            $inc: { attemptsUsed: 1 }
        });
        
        // Get updated user
        const user = await User.findById(userId);
        
        res.json({
            success: true,
            score: score,
            total: content.questions.length,
            review: review,
            attemptsLeft: user.maxAttempts - user.attemptsUsed
        });
        
    } catch (error) {
        console.error('Submission error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get student's submissions
router.get('/student/:studentId', authMiddleware, async (req, res) => {
    try {
        const submissions = await Submission.find({ studentId: req.params.studentId })
            .populate('contentId', 'mainTopic subject description')
            .sort({ submittedAt: -1 });
        
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all submissions (admin)
router.get('/admin/submissions', authMiddleware, async (req, res) => {
    try {
        const submissions = await Submission.find()
            .populate('studentId', 'name email grade')
            .populate('contentId', 'mainTopic subject')
            .sort({ submittedAt: -1 });
        
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;