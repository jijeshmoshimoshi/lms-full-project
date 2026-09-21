const Snippet = require('../models/Snippet');

exports.createSnippet = async (req, res) => {
  try {
    const { title, language, htmlCode, cssCode, jsCode, code, isPublic, description } = req.body;

    const snippet = await Snippet.create({
      user: req.user._id,
      title: title || 'Untitled Snippet',
      language: language || 'web',
      htmlCode: htmlCode || '',
      cssCode: cssCode || '',
      jsCode: jsCode || '',
      code: code || '',
      isPublic: isPublic !== undefined ? isPublic : true,
      description: description || '',
    });

    res.status(201).json({
      success: true,
      message: 'Snippet saved to cloud successfully',
      snippet,
    });
  } catch (err) {
    console.error('[Snippet Controller] Create error:', err);
    res.status(500).json({ success: false, message: 'Failed to save snippet', error: err.message });
  }
};

exports.getMySnippets = async (req, res) => {
  try {
    const snippets = await Snippet.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .lean();

    res.json({
      success: true,
      count: snippets.length,
      snippets,
    });
  } catch (err) {
    console.error('[Snippet Controller] Get my snippets error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve snippets' });
  }
};

exports.getSnippetById = async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.id)
      .populate('user', 'name email avatar')
      .lean();

    if (!snippet) {
      return res.status(404).json({ success: false, message: 'Snippet not found' });
    }

    res.json({
      success: true,
      snippet,
    });
  } catch (err) {
    console.error('[Snippet Controller] Get snippet by ID error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve snippet' });
  }
};

exports.updateSnippet = async (req, res) => {
  try {
    let snippet = await Snippet.findById(req.params.id);

    if (!snippet) {
      return res.status(404).json({ success: false, message: 'Snippet not found' });
    }

    if (snippet.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this snippet' });
    }

    const { title, language, htmlCode, cssCode, jsCode, code, isPublic, description } = req.body;

    if (title !== undefined) snippet.title = title;
    if (language !== undefined) snippet.language = language;
    if (htmlCode !== undefined) snippet.htmlCode = htmlCode;
    if (cssCode !== undefined) snippet.cssCode = cssCode;
    if (jsCode !== undefined) snippet.jsCode = jsCode;
    if (code !== undefined) snippet.code = code;
    if (isPublic !== undefined) snippet.isPublic = isPublic;
    if (description !== undefined) snippet.description = description;

    await snippet.save();

    res.json({
      success: true,
      message: 'Snippet updated successfully',
      snippet,
    });
  } catch (err) {
    console.error('[Snippet Controller] Update error:', err);
    res.status(500).json({ success: false, message: 'Failed to update snippet' });
  }
};

exports.deleteSnippet = async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.id);

    if (!snippet) {
      return res.status(404).json({ success: false, message: 'Snippet not found' });
    }

    if (snippet.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this snippet' });
    }

    await snippet.deleteOne();

    res.json({
      success: true,
      message: 'Snippet deleted successfully',
    });
  } catch (err) {
    console.error('[Snippet Controller] Delete error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete snippet' });
  }
};
