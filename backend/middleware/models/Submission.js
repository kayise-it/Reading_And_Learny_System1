// middleware/models/Submission.js
const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content',
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    answers: [{
        question: String,
        selected: String,
        correctAnswer: String,
        correct: Boolean
    }],
    submittedAt: {
        type: Date,
        default: Date.now
    },
    isManuallyReviewed: {
        type: Boolean,
        default: false
    },
    adminFeedback: String
});

module.exports = mongoose.model('Submission', SubmissionSchema);