const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createSnippet,
  getMySnippets,
  getSnippetById,
  updateSnippet,
  deleteSnippet,
} = require('../controllers/snippetController');

const router = express.Router();

router.route('/')
  .post(protect, createSnippet)
  .get(protect, getMySnippets);

router.route('/:id')
  .get(getSnippetById)
  .put(protect, updateSnippet)
  .delete(protect, deleteSnippet);

module.exports = router;
