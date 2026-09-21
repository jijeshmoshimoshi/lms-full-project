const aiService = require('../services/aiService');

exports.chat = async (req, res) => {
  try {
    const { message, history, currentPath, courseSlug } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Limit input message length to prevent token bomb / abuse
    const cleanMessage = message.trim().slice(0, 1000);

    const response = await aiService.generateChatResponse({
      message: cleanMessage,
      history: Array.isArray(history) ? history.slice(-8) : [],
      currentPath: currentPath || '',
      courseSlug: courseSlug || null,
    });

    res.json({
      success: true,
      data: response,
    });
  } catch (err) {
    console.error('[AI Controller] Chat error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to process AI chat request',
      error: err.message,
    });
  }
};

exports.getSuggestions = async (req, res) => {
  try {
    const { courseSlug } = req.query;
    const suggestions = await aiService.getInitialSuggestions(courseSlug);
    res.json({
      success: true,
      suggestions,
    });
  } catch (err) {
    console.error('[AI Controller] Suggestions error:', err);
    res.status(500).json({
      success: false,
      suggestions: [
        'What courses are available for beginners?',
        'Show best-selling courses',
        'How do certificates work?'
      ],
    });
  }
};

exports.assistCode = async (req, res) => {
  try {
    const { code, language = 'javascript', action = 'explain', prompt = '' } = req.body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Code snippet is required' });
    }

    const cleanCode = code.slice(0, 15000); // 15kb safety limit
    const cleanPrompt = (prompt || '').slice(0, 1000);

    const result = await aiService.assistCode({
      code: cleanCode,
      language,
      action,
      prompt: cleanPrompt,
    });

    res.json(result);
  } catch (err) {
    console.error('[AI Controller] Assist Code error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to process AI code request',
      error: err.message,
    });
  }
};

exports.autocomplete = async (req, res) => {
  try {
    const { prefix = '', suffix = '', language = 'javascript' } = req.body;
    const cleanPrefix = String(prefix || '').slice(-2000);
    const cleanSuffix = String(suffix || '').slice(0, 1000);

    const result = await aiService.autocompleteCode({
      prefix: cleanPrefix,
      suffix: cleanSuffix,
      language,
    });

    res.json(result);
  } catch (err) {
    console.error('[AI Controller] Autocomplete error:', err);
    res.status(500).json({
      success: false,
      completion: '',
      error: err.message,
    });
  }
};

exports.askVideo = async (req, res) => {
  try {
    const { query, lessonId, lessonTitle, courseTitle, duration } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ success: false, message: 'Question query is required' });
    }

    const cleanQuery = query.trim().slice(0, 500);

    const result = await aiService.searchVideoTranscript({
      query: cleanQuery,
      lessonId,
      lessonTitle: lessonTitle || 'Lecture Video',
      courseTitle: courseTitle || '',
      duration: Number(duration) || 10,
    });

    res.json(result);
  } catch (err) {
    console.error('[AI Controller] Ask Video error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to search video transcript',
      error: err.message,
    });
  }
};

exports.getTranscript = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { title, duration } = req.query;

    const transcript = await aiService.getLessonTranscript({
      lessonId,
      lessonTitle: title || 'Lecture Video',
      duration: Number(duration) || 10,
    });

    res.json({
      success: true,
      transcript,
    });
  } catch (err) {
    console.error('[AI Controller] Get Transcript error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transcript',
      transcript: [],
    });
  }
};




