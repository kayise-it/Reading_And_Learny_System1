// middleware/models/Content.js
const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
    grade: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    mainTopic: {
        type: String,
        required: true
    },
    description: String,
    contentType: {
        type: String,
        enum: ['quiz', 'notes'],
        default: 'quiz'
    },
    questions: [{
        question: String,
        options: [String],
        answer: String
    }],
    definitions: [{
        word: String,
        meaning: String
    }],
    subTopics: [{
        title: String,
        content: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Content', ContentSchema);