const express = require('express');
const rateLimit = require('express-rate-limit');
const { 
  chat, 
  getSuggestions, 
  assistCode, 
  autocomplete, 
  askVideo, 
  getTranscript 
} = require('../controllers/aiController');

const router = express.Router();


// Dedicated rate limiter for AI queries (60 requests per 15 min per IP)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many queries to the AI Assistant. Please pause for a moment before asking again.',
  },
});

router.post('/chat', aiLimiter, chat);
router.post('/assist-code', aiLimiter, assistCode);
router.post('/autocomplete', autocomplete);
router.post('/ask-video', aiLimiter, askVideo);
router.get('/transcript/:lessonId', getTranscript);
router.get('/suggestions', getSuggestions);

module.exports = router;



