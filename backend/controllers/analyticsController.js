import asyncHandler from 'express-async-handler';
import QuizAttempt from '../models/quizAttemptModel.js';
import Roadmap from '../models/roadmapModel.js';
import KnowledgeNode from '../models/knowledgeModel.js';
import CategoryMapping from '../models/categoryMappingModel.js';

// @desc    Get user analytics (progress, weak/strong areas)
// @route   GET /api/analytics
// @access  Private
const getAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  console.log('Fetching analytics for userId:', userId.toString());
  
  const quizAttempts = await QuizAttempt.find({ user: userId });
  const roadmaps = await Roadmap.find({ user: userId });
  
  console.log('Found roadmaps:', roadmaps.length);
  console.log('Found quizAttempts:', quizAttempts.length);
  
  // Debug: Check if there are roadmaps in total
  const totalRoadmapsCount = await Roadmap.countDocuments();
  const roadmapsWithoutUser = await Roadmap.countDocuments({ user: null });
  console.log('Total roadmaps in DB:', totalRoadmapsCount);
  console.log('Roadmaps without user field:', roadmapsWithoutUser);
  
  if (roadmaps.length === 0 && totalRoadmapsCount > 0) {
    console.log('No roadmaps found for this user. Sample roadmaps:');
    const samples = await Roadmap.find().limit(2);
    samples.forEach(r => {
      console.log('Roadmap:', r._id, 'user:', r.user, 'title:', r.title);
    });
  }

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
    if (roadmap && roadmap.modules && Array.isArray(roadmap.modules)) {
      roadmap.modules.forEach((module) => {
        totalModules += 1;
        if (module && module.isCompleted) {
          completedModules += 1;
        }
      });
    }
  });

  const moduleCompletionRate = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  // Calculate estimated learning time
  let estimatedLearningTime = 0;
  roadmaps.forEach((roadmap) => {
    if (roadmap && roadmap.modules && Array.isArray(roadmap.modules)) {
      roadmap.modules.forEach((module) => {
        if (module && module.estimatedTime) {
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
    }
  });

  // NEW: Category-based Mastery (for Skill Tree)
  const categoryStats = {
    'DSA': { totalScore: 0, count: 0, completedModules: 0 },
    'System Design': { totalScore: 0, count: 0, completedModules: 0 },
    'OS': { totalScore: 0, count: 0, completedModules: 0 },
    'Database': { totalScore: 0, count: 0, completedModules: 0 },
  };

  // Fetch all mappings from DB
  const dynamicMappings = await CategoryMapping.find();

  const getAttributedCategories = (str) => {
    if (!str) return ['General'];
    const lowerStr = str.toLowerCase();
    const categories = new Set();
    
    dynamicMappings.forEach(mapping => {
      if (lowerStr.includes(mapping.tag)) {
        mapping.categories.forEach(cat => categories.add(cat));
      }
    });

    return categories.size > 0 ? Array.from(categories) : ['General'];
  };

  // 1. Process Roadmap Progress
  roadmaps.forEach(roadmap => {
    if (!roadmap) return;
    const attributedCats = getAttributedCategories(roadmap.topic || roadmap.title);
    
    attributedCats.forEach(cat => {
      if (!categoryStats[cat]) {
        categoryStats[cat] = { totalScore: 0, count: 0, completedModules: 0 };
      }
      
      if (roadmap.modules && Array.isArray(roadmap.modules)) {
        roadmap.modules.forEach(m => {
          if (m && m.isCompleted) {
            categoryStats[cat].completedModules += 1;
          }
        });
      }
    });
  });

  // 2. Map quiz attempts to categories
  if (quizAttempts && Array.isArray(quizAttempts)) {
    for (const attempt of quizAttempts) {
      if (!attempt) continue;
      const attributedCats = getAttributedCategories(attempt.moduleTitle);
      
      attributedCats.forEach(cat => {
        if (!categoryStats[cat]) {
          categoryStats[cat] = { totalScore: 0, count: 0, completedModules: 0 };
        }
        categoryStats[cat].totalScore += (attempt.score || 0);
        categoryStats[cat].count += 1;
      });
    }
  }

  const categoryMastery = Object.entries(categoryStats).map(([name, data]) => ({
    category: name,
    averageScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
    completionCount: data.completedModules,
    modulesToNextLevel: 3 - (data.completedModules % 3),
    level: Math.floor(data.completedModules / 3) + 1, // Level up every 3 completed modules
    progress: Math.min(100, Math.round(((data.completedModules % 3) / 3) * 100))
  })).filter(c => c.completionCount > 0 || ['DSA', 'System Design', 'OS', 'Database'].includes(c.category));

  res.json({
    // Old format (for backward compatibility)
    totalCompletedRoadmaps: roadmaps.filter((r) => r.progress === 100).length,
    totalInProgressRoadmaps: roadmaps.filter((r) => r.progress > 0 && r.progress < 100).length,
    overallProgress: totalProgress,
    strongAreas,
    weakAreas,
    
    // New format
    totalRoadmaps: totalRoadmapsCreated,
    totalQuizzes: totalQuizzesTaken,
    averageScore: averageQuizScore,
    moduleCompletionRate,
    completedModules,
    totalModules,
    estimatedLearningTime,
    categoryMastery,
    topicBreakdown: (typeof topicScores !== 'undefined' && topicScores) ? Object.fromEntries(
      Object.entries(topicScores).map(([k, v]) => [k, v.count])
    ) : {},
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
  const quizAttempts = await QuizAttempt.find({ user: userId })
    .populate('roadmap', 'title')
    .sort({ createdAt: -1 });

  const stats = quizAttempts.map((attempt) => ({
    _id: attempt._id,
    moduleTitle: attempt.moduleTitle,
    roadmapTitle: attempt.roadmap?.title || 'External Source',
    roadmapId: attempt.roadmap?._id,
    score: attempt.score,
    answers: attempt.answers || [],
    createdAt: attempt.createdAt,
    attemptedAt: attempt.createdAt, // For backward compatibility with frontend
  }));

  res.json(stats);
});

export { getAnalytics, getRoadmapStats, getQuizStats };