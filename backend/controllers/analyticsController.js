import asyncHandler from 'express-async-handler';
import QuizAttempt from '../models/quizAttemptModel.js';
import Roadmap from '../models/roadmapModel.js';

// @desc    Get user analytics (progress, weak/strong areas)
// @route   GET /api/analytics
// @access  Private
const getAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const quizAttempts = await QuizAttempt.find({ user: userId });
  const roadmaps = await Roadmap.find({ user: userId });

  // Simple aggregation for strong/weak areas
  const topicScores = {};
  quizAttempts.forEach((attempt) => {
    if (!topicScores[attempt.moduleTitle]) {
      topicScores[attempt.moduleTitle] = { totalScore: 0, count: 0 };
    }
    topicScores[attempt.moduleTitle].totalScore += attempt.score;
    topicScores[attempt.moduleTitle].count++;
  });

  const areas = Object.entries(topicScores).map(([title, data]) => ({
    topic: title,
    averageScore: Math.round((data.totalScore / data.count) * 100) / 100,
  }));

  const strongAreas = areas
    .filter((a) => a.averageScore >= 80)
    .sort((a, b) => b.averageScore - a.averageScore);
  const weakAreas = areas
    .filter((a) => a.averageScore < 80)
    .sort((a, b) => a.averageScore - b.averageScore);

  const totalProgress =
    roadmaps.reduce((acc, r) => acc + r.progress, 0) /
    (roadmaps.length || 1);

  // Calculate total statistics
  const totalRoadmapsCreated = roadmaps.length;
  const totalQuizzesTaken = quizAttempts.length;
  
  let averageQuizScore = 0;
  if (quizAttempts.length > 0) {
    const totalScore = quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0);
    averageQuizScore = Math.round((totalScore / quizAttempts.length) * 100) / 100;
  }

  // Calculate module completion rate
  let totalModules = 0;
  let completedModules = 0;
  roadmaps.forEach((roadmap) => {
    roadmap.modules.forEach((module) => {
      totalModules += 1;
      if (module.isCompleted) {
        completedModules += 1;
      }
    });
  });

  const moduleCompletionRate = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  // Calculate estimated learning time
  let estimatedLearningTime = 0;
  roadmaps.forEach((roadmap) => {
    roadmap.modules.forEach((module) => {
      if (module.estimatedTime) {
        const timeStr = module.estimatedTime;
        if (timeStr.includes('hour')) {
          const hours = parseInt(timeStr.match(/\d+/)?.[0] || '0');
          estimatedLearningTime += hours;
        } else if (timeStr.includes('week')) {
          const weeks = parseInt(timeStr.match(/\d+/)?.[0] || '0');
          estimatedLearningTime += weeks * 40;
        } else if (timeStr.includes('day')) {
          const days = parseInt(timeStr.match(/\d+/)?.[0] || '0');
          estimatedLearningTime += days * 8;
        }
      }
    });
  });

  // Calculate topic breakdown (count quizzes by topic)
  const topicBreakdown = {};
  quizAttempts.forEach((attempt) => {
    const topic = attempt.moduleTitle || 'Other';
    topicBreakdown[topic] = (topicBreakdown[topic] || 0) + 1;
  });

  res.json({
    // Old format (for backward compatibility)
    totalCompletedRoadmaps: roadmaps.filter((r) => r.progress === 100).length,
    totalInProgressRoadmaps: roadmaps.filter((r) => r.progress > 0 && r.progress < 100).length,
    overallProgress: totalProgress,
    strongAreas,
    weakAreas,
    
    // New format
    totalRoadmapsCreated,
    totalQuizzesTaken,
    averageQuizScore,
    moduleCompletionRate,
    completedModules,
    totalModules,
    estimatedLearningTime,
    topicBreakdown,
  });
});

// @desc    Get detailed roadmap statistics
// @route   GET /api/analytics/roadmaps
// @access  Private
const getRoadmapStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const roadmaps = await Roadmap.find({ user: userId }).select(
    'title topic progress createdAt modules'
  );

  const stats = roadmaps.map((roadmap) => {
    const totalModules = roadmap.modules.length;
    const completedModules = roadmap.modules.filter((m) => m.isCompleted).length;
    const progress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

    return {
      _id: roadmap._id,
      title: roadmap.title,
      topic: roadmap.topic || 'General',
      progress,
      completedModules,
      totalModules,
      createdAt: roadmap.createdAt,
      modules: roadmap.modules,
    };
  });

  res.json(stats);
});

// @desc    Get detailed quiz statistics
// @route   GET /api/analytics/quizzes
// @access  Private
const getQuizStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const quizAttempts = await QuizAttempt.find({ user: userId }).sort({ createdAt: -1 });

  const stats = quizAttempts.map((attempt) => ({
    id: attempt._id,
    moduleName: attempt.moduleTitle,
    score: attempt.score,
    totalQuestions: attempt.totalQuestions,
    createdAt: attempt.createdAt,
  }));

  res.json(stats);
});

export { getAnalytics, getRoadmapStats, getQuizStats };