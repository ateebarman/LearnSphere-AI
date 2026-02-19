import asyncHandler from 'express-async-handler';
import CodingQuestion from '../models/codingQuestionModel.js';
import UserCodingProgress from '../models/userCodingProgressModel.js';
import User from '../models/userModel.js';
import Submission from '../models/submissionModel.js';
import { executeCode } from '../services/compilerService.js';
import { generateCodingQuestionFromAI } from '../services/codingGenerator.js';
import { getFromCache, setInCache } from '../utils/cache.js';

/**
 * Wraps user code with a test driver if no entry point is detected.
 * Provides a robust fallback for older questions missing a testDriver.
 */
const wrapUserCode = (code, language, driver, preDriver) => {
  const hasEntryPoint = {
    cpp: /int\s+main\s*\(|void\s+main\s*\(/.test(code),
    python: /if\s+__name__\s*==\s*['"]__main__['"]/.test(code),
    javascript: code.includes('process.stdin') || code.includes('fs.readFileSync(0)'),
  };

  if (hasEntryPoint[language]) return code;

  let wrapped = '';

  // 1. Headers
  if (language === 'cpp') {
    wrapped += `#include <bits/stdc++.h>\nusing namespace std;\n\n`;
  }

  // 2. Pre-Driver (Type definitions, helpers)
  if (preDriver) {
    wrapped += preDriver + "\n\n";
  }

  // 3. User Code
  wrapped += code + "\n\n";

  // 4. Post-Driver (Execution logic)
  if (driver) {
    wrapped += driver;
  }

  return wrapped;
};

// @desc    Generate/Fetch coding questions for a topic
// @route   POST /api/coding/generate
// @access  Private
export const generateQuestions = asyncHandler(async (req, res) => {
  const { topic } = req.body;
  
  if (!topic) {
    res.status(400);
    throw new Error('Topic is required');
  }

  // Return existing verified questions
  const questions = await CodingQuestion.find({ 
    topic: { $regex: new RegExp(`^${topic}$`, 'i') } 
  }).limit(50);
  res.json(questions);
});

// @desc    Explicitly trigger AI generation for a topic
// @route   POST /api/coding/generate-ai
// @access  Private
export const triggerAiGeneration = asyncHandler(async (req, res) => {
  const { topic, description = '', count = 1 } = req.body;
  
  const results = [];
  for (let i = 0; i < count; i++) {
    try {
      const data = await generateCodingQuestionFromAI(topic, description);
      const question = await CodingQuestion.create({
        topic: topic.toLowerCase(),
        ...data
      });
      results.push(question);
    } catch (error) {
      console.error(`Failed to generate question ${i+1}:`, error.message);
    }
  }
  
  res.json(results);
});

// @desc    Run code against visible test cases
// @route   POST /api/coding/run
// @access  Private
export const runCode = asyncHandler(async (req, res) => {
  const { questionId, code, language } = req.body;

  const question = await CodingQuestion.findById(questionId);
  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }

  const driver = question.judgeDriver?.[language];
  const preDriver = question.judgePreDriver?.[language];
  const finalCode = wrapUserCode(code, language, driver, preDriver);

  // Unified batch input: [Count]\n[Input 1]\n[Input 2]...
  const batchInput = `${question.visibleTestCases.length}\n${question.visibleTestCases.map(tc => tc.input).join('\n')}`;

  const execution = await executeCode(finalCode, language, batchInput);
  
  // If execution failed (compilation error, TLE, etc.)
  if (execution.status !== 'Accepted') {
     return res.json([{ 
        status: execution.status,
        compile_output: execution.compile_output,
        stderr: execution.stderr,
        passed: false 
     }]);
  }

  const outputs = execution.stdout.split('CASE_RESULT_DELIMITER').map(s => s.trim()).filter(Boolean);
  
  const results = question.visibleTestCases.map((testCase, idx) => {
    const actual = (outputs[idx] || '').replace(/\s/g, '');
    const expected = testCase.expectedOutput.replace(/\s/g, '');
    return {
      input: testCase.input,
      expected: testCase.expectedOutput,
      actual: outputs[idx] || '',
      status: execution.status,
      stderr: execution.stderr,
      compile_output: execution.compile_output,
      time: execution.time,
      memory: execution.memory,
      passed: actual === expected,
    };
  });

  res.json(results);
});

// @desc    Submit code against all test cases
// @route   POST /api/coding/submit
// @access  Private
export const submitCode = asyncHandler(async (req, res) => {
  const { questionId, code, language, topic } = req.body;
  const userId = req.user._id;

  const question = await CodingQuestion.findById(questionId);
  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }

  const allTestCases = [...question.visibleTestCases, ...question.hiddenTestCases];
  const driver = question.judgeDriver?.[language];
  const preDriver = question.judgePreDriver?.[language];
  const finalCode = wrapUserCode(code, language, driver, preDriver);
  
  const batchInput = `${allTestCases.length}\n${allTestCases.map(tc => tc.input).join('\n')}`;
  const execution = await executeCode(finalCode, language, batchInput);

  if (execution.status !== 'Accepted') {
    return res.json({
        success: false,
        status: execution.status,
        compile_output: execution.compile_output,
        stderr: execution.stderr
    });
  }

  const outputs = execution.stdout.split('CASE_RESULT_DELIMITER').map(s => s.trim()).filter(Boolean);
  
  let passedCount = 0;
  const results = allTestCases.map((testCase, idx) => {
    const actual = (outputs[idx] || '').replace(/\s/g, '');
    const expected = testCase.expectedOutput.replace(/\s/g, '');
    const passed = actual === expected;
    if (passed) passedCount++;
    return { passed, input: testCase.input, expected: testCase.expectedOutput, actual: outputs[idx] };
  });

  const isAccepted = passedCount === allTestCases.length;
  const failedResults = results.filter(r => !r.passed);

  // Save submission
  await Submission.create({
    user: userId,
    question: questionId,
    language,
    code,
    status: isAccepted ? 'Accepted' : (execution.status === 'Accepted' ? 'Wrong Answer' : execution.status),
    passedCount,
    totalCount: allTestCases.length,
    runtime: execution.time,
    memory: execution.memory
  });

  // Dynamic Acceptance Rate Update
  const totalSubmissions = await Submission.countDocuments({ question: questionId });
  const acceptedSubmissions = await Submission.countDocuments({ question: questionId, status: 'Accepted' });
  const acceptanceRate = totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0;

  await CodingQuestion.findByIdAndUpdate(questionId, {
    acceptanceRate,
    submissionStats: { totalSubmissions, acceptedSubmissions }
  });

  let progress = await UserCodingProgress.findOne({ 
    user: userId, 
    topic: { $regex: new RegExp(`^${topic}$`, 'i') } 
  });
  if (!progress) {
    progress = new UserCodingProgress({ 
        user: userId, 
        topic: topic // Keep original case or decide on one
    });
  }

  progress.attempts += 1;
  if (isAccepted) {
    progress.solvedQuestions += 1;
    progress.lastSolvedAt = new Date();
    progress.streak += 1;
    // Track specific solved question
    if (!progress.solvedProblems.includes(questionId)) {
        progress.solvedProblems.push(questionId);
    }
  }
  
  progress.accuracy = Math.round((progress.solvedQuestions / progress.attempts) * 100);
  await progress.save();

  // Update Global User Stats
  const user = await User.findById(userId);
  if (user) {
    if (isAccepted && !user.solvedProblems.includes(questionId)) {
        user.solvedProblems.push(questionId);
        
        const now = new Date();
        const lastSolved = user.lastSolvedAt;
        
        if (!lastSolved) {
            user.streak = 1;
        } else {
            const diffInHours = (now - lastSolved) / (1000 * 60 * 60);
            if (diffInHours < 24) {
               // Already solved today, don't increment streak again if already incremented
               // Actually streak should be daily. If last solved was yesterday, streak++
               const lastSolvedDay = new Date(lastSolved).setHours(0,0,0,0);
               const today = new Date().setHours(0,0,0,0);
               if (today > lastSolvedDay) {
                   user.streak += 1;
               }
            } else if (diffInHours < 48) {
                user.streak += 1;
            } else {
                user.streak = 1;
            }
        }
        user.lastSolvedAt = now;
    } else if (isAccepted) {
        user.lastSolvedAt = new Date();
    }
    await user.save();
  }

  res.json({
    status: isAccepted ? 'Accepted' : (execution.status === 'Accepted' ? 'Wrong Answer' : execution.status),
    passed: passedCount,
    total: allTestCases.length,
    failedCases: isAccepted ? [] : failedResults.slice(0, 1),
    visibleResults: results.slice(0, question.visibleTestCases.length),
    progress,
  });
});

// @desc    Get all coding problems with filtering and pagination
// @route   GET /api/coding/problems
// @access  Private
export const getProblems = asyncHandler(async (req, res) => {
  const { topic, difficulty, search, status, page = 1, limit = 20 } = req.query;
  const userId = req.user._id;

  const query = {};
  
  // Escape regex special characters in topic
  if (topic) {
    const escapedTopic = topic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.topic = { $regex: new RegExp(`^${escapedTopic}$`, 'i') };
  }

  if (difficulty) query.difficulty = difficulty;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { topic: { $regex: search, $options: 'i' } }
    ];
  }

  // Get user progress to handle solved/unsolved filters
  const userProgress = await UserCodingProgress.find({ user: userId }).select('solvedProblems');
  const solvedQuestionIds = userProgress.flatMap(p => p.solvedProblems.map(id => id.toString()));

  if (status === 'solved') {
    query._id = { $in: solvedQuestionIds };
  } else if (status === 'unsolved') {
    query._id = { $nin: solvedQuestionIds };
  }

  // Check cache for non-user-specific queries
  // Only cache if NO status filter is applied (status is user-specific)
  const canCache = !status;
  const cacheKey = canCache 
    ? `problems:list:${topic || 'all'}:${difficulty || 'all'}:${search || 'none'}:${page}:${limit}`
    : null;

  if (canCache) {
    const cached = await getFromCache(cacheKey);
    if (cached) {
      // Still need to calculate isSolved for the cached results
      const solvedSet = new Set(solvedQuestionIds);
      const problemsWithStatus = cached.problems.map(p => ({
        ...p,
        isSolved: solvedSet.has(p._id.toString())
      }));

      return res.json({
        ...cached,
        problems: problemsWithStatus
      });
    }
  }

  const skip = (page - 1) * limit;

  const [problems, total] = await Promise.all([
    CodingQuestion.find(query)
      .select('title difficulty topic slug')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: 1 }) // curriculum order
      .lean(), // Optimization: use lean()
    CodingQuestion.countDocuments(query),
  ]);

  const resultData = {
    problems,
    page: Number(page),
    pages: Math.ceil(total / limit),
    total
  };

  if (canCache) {
    await setInCache(cacheKey, resultData, 600); // Cache for 10 minutes
  }

  const solvedSet = new Set(solvedQuestionIds);

  const problemsWithStatus = problems.map(p => ({
    ...p, // p is already a POJO due to .lean()
    isSolved: solvedSet.has(p._id.toString())
  }));

  res.json({
    ...resultData,
    problems: problemsWithStatus
  });
});

// @desc    Get single problem by slug
// @route   GET /api/coding/problems/:slug
// @access  Private
export const getProblemBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const problem = await CodingQuestion.findOne({ slug });

  if (!problem) {
    res.status(404);
    throw new Error('Problem not found');
  }

  res.json(problem);
});

// @desc    Get user coding progress
// @route   GET /api/coding/progress
// @access  Private
export const getProgress = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { topic } = req.query;

  const query = { user: userId };
  if (topic) query.topic = { $regex: new RegExp(`^${topic}$`, 'i') };

  const progress = await UserCodingProgress.find(query);
  res.json(progress);
});

// @desc    Get detailed coding analytics for user
// @route   GET /api/coding/analytics
// @access  Private
export const getAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [user, progress, recentSubmissions] = await Promise.all([
    User.findById(userId).select('streak lastSolvedAt solvedProblems'),
    UserCodingProgress.find({ user: userId }),
    Submission.find({ user: userId })
      .populate('question', 'title difficulty')
      .sort({ createdAt: -1 })
      .limit(10)
  ]);

  // Calculate difficulty breakdown
  const difficultyBreakdown = {
    Easy: 0,
    Medium: 0,
    Hard: 0
  };

  const solvedQuestionIds = user?.solvedProblems || [];
  const solvedQuestions = await CodingQuestion.find({ _id: { $in: solvedQuestionIds } }).select('difficulty');
  
  solvedQuestions.forEach(q => {
    if (difficultyBreakdown[q.difficulty] !== undefined) {
      difficultyBreakdown[q.difficulty]++;
    }
  });

  // Calculate submission activity (last 7 days)
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push({
          date: d.toISOString().split('T')[0],
          count: 0
      });
  }

  const submissionsLast7Days = await Submission.find({
      user: userId,
      createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 7)) }
  });

  submissionsLast7Days.forEach(s => {
      const date = s.createdAt.toISOString().split('T')[0];
      const day = last7Days.find(d => d.date === date);
      if (day) day.count++;
  });

  res.json({
    stats: {
      totalSolved: solvedQuestionIds.length,
      streak: user?.streak || 0,
      accuracy: progress.length > 0 
        ? Math.round(progress.reduce((acc, p) => acc + p.accuracy, 0) / progress.length)
        : 0,
    },
    difficultyBreakdown,
    recentSubmissions,
    activity: last7Days
  });
});

// @desc    Get submissions for a specific problem by user
// @route   GET /api/coding/submissions/:questionId
// @access  Private
export const getSubmissions = asyncHandler(async (req, res) => {
  const { questionId } = req.params;
  const userId = req.user._id;

  const submissions = await Submission.find({ user: userId, question: questionId })
    .sort({ createdAt: -1 });

  res.json(submissions);
});
