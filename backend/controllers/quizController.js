import asyncHandler from 'express-async-handler';
import {
  generateQuizFromAI,
  getRecommendationsFromAI,
} from '../services/geminiService.js';
import QuizAttempt from '../models/quizAttemptModel.js';
import Roadmap from '../models/roadmapModel.js';
import KnowledgeNode from '../models/knowledgeModel.js';

// @desc    Generate a quiz for a module
// @route   POST /api/quizzes/generate
// @access  Private
const generateQuiz = asyncHandler(async (req, res) => {
  const { moduleTitle, topic } = req.body;
  if (!moduleTitle || !topic) {
    res.status(400);
    throw new Error('Module title and topic are required');
  }

  const quizData = await generateQuizFromAI(moduleTitle, topic, '');
  res.json(quizData);
});

// @desc    Submit quiz answers and get feedback
// @route   POST /api/quizzes/submit
// @access  Private
const submitQuiz = asyncHandler(async (req, res) => {
  const { roadmapId, moduleTitle, answers, questions } = req.body;
  
  // 1. Grade the quiz
  let score = 0;
  const detailedAnswers = [];
  const incorrectTopics = [];

  questions.forEach((q, index) => {
    const userAnswer = answers[index];
    const isCorrect = userAnswer === q.correctAnswer;
    if (isCorrect) {
      score++;
    } else {
      incorrectTopics.push(q.question); // Use question as a proxy for topic
    }
    detailedAnswers.push({
      question: q.question,
      selectedAnswer: userAnswer,
      correctAnswer: q.correctAnswer,
      isCorrect: isCorrect,
    });
  });

  const percentageScore = (score / questions.length) * 100;

  // 2. Get AI recommendations
  const { feedback } = await getRecommendationsFromAI(
    moduleTitle,
    percentageScore,
    incorrectTopics
  );

  // 3. Save the quiz attempt
  const attemptData = {
    user: req.user._id,
    moduleTitle: moduleTitle,
    score: percentageScore,
    answers: detailedAnswers,
    recommendations: feedback,
  };

  // Only add roadmap if it's a valid ObjectId
  if (roadmapId && roadmapId !== 'knowledge' && roadmapId.match(/^[0-9a-fA-F]{24}$/)) {
    attemptData.roadmap = roadmapId;
  }

  const quizAttempt = new QuizAttempt(attemptData);
  await quizAttempt.save();

  // 4. Update roadmap progress (ONLY if it's a roadmap-linked quiz)
  if (percentageScore >= 70 && attemptData.roadmap) {
    const roadmap = await Roadmap.findById(attemptData.roadmap);
    if (roadmap) {
      const module = roadmap.modules.find((m) => m.title === moduleTitle);
      if (module) {
        module.isCompleted = true;
      }
      // Recalculate overall progress
      const completedModules = roadmap.modules.filter(
        (m) => m.isCompleted
      ).length;
      roadmap.progress = (completedModules / roadmap.modules.length) * 100;
      await roadmap.save();
    }
  }

  res.json({
    score: percentageScore,
    feedback: feedback,
    detailedAnswers: detailedAnswers,
  });
});

export { generateQuiz, submitQuiz };