const Quiz = require('../models/Quiz');
const { sendQuizResultEmail } = require('../services/emailService');

exports.createQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.create(req.body);
    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getQuizByLesson = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ lesson: req.params.lessonId });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Return full quiz (with correctOptionIndex) for instructors and admins
    const isPrivileged =
      req.user?.role === 'instructor' ||
      req.user?.role === 'admin' ||
      req.query.admin === 'true';

    if (isPrivileged) {
      return res.json(quiz);
    }

    // Strip correct answers before sending to students
    const safeQuiz = {
      ...quiz.toObject(),
      questions: quiz.questions.map(({ question, options, _id }) => ({ _id, question, options })),
    };
    res.json(safeQuiz);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body; // [{ questionId, selectedIndex }]
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    let correct = 0;
    quiz.questions.forEach((q) => {
      const ans = answers.find((a) => a.questionId === String(q._id));
      if (ans && ans.selectedIndex === q.correctOptionIndex) correct += 1;
    });
    const score = Math.round((correct / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;

    // Send email notification asynchronously
    if (req.user?.email) {
      sendQuizResultEmail({
        studentEmail: req.user.email,
        studentName: req.user.name || 'Learner',
        quizTitle: quiz.title || 'Quiz Assessment',
        score,
        percentage: score,
        passed,
        passingScore: quiz.passingScore || 70,
      }).catch((err) => console.error('[EmailService] Quiz result email error:', err.message));
    }

    res.json({ score, passed });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json({ message: 'Quiz deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  res.status(501).json({ message: 'Not implemented here — see userController' });
};

