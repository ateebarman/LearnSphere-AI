import asyncHandler from 'express-async-handler';
import CodingQuestion from '../models/codingQuestionModel.js';
import UserCodingProgress from '../models/userCodingProgressModel.js';
import User from '../models/userModel.js';
import Submission from '../models/submissionModel.js';
import { executeCode, submitToJudge, getJudgeResult } from '../services/compilerService.js';
import { generateCodingQuestionFromAI } from '../services/codingGenerator.js';
import { getFromCache, setInCache, removeFromCache } from '../utils/cache.js';

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

// @desc    Run code against visible test cases (Async)
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

  // Unified batch input
  const batchInput = `${question.visibleTestCases.length}\n${question.visibleTestCases.map(tc => tc.input).join('\n')}`;

  const token = await submitToJudge(finalCode, language, batchInput);
  
  // Store run context (optional, but keeps type info)
  await setInCache(`env:execution:${token}`, { 
    type: 'run',
    questionId: questionId
  }, 300);

  res.status(202).json({ 
    token, 
    status: 'Processing',
    type: 'run',
    questionId 
  });
});

// @desc    Submit code against all test cases (Async)
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

  const allTestCases = [...(question.visibleTestCases || []), ...(question.hiddenTestCases || [])];
  const driver = question.judgeDriver?.[language];
  const preDriver = question.judgePreDriver?.[language];
  const finalCode = wrapUserCode(code, language, driver, preDriver);
  
  const batchInput = `${allTestCases.length}\n${allTestCases.map(tc => tc.input).join('\n')}`;
  
  const token = await submitToJudge(finalCode, language, batchInput);

  // Store FULL submission context in cache to avoid query param length issues
  await setInCache(`env:execution:${token}`, { 
    type: 'submit',
    userId,
    questionId,
    code,
    language,
    topic
  }, 600); // 10 minutes cache

  res.status(202).json({ 
    token, 
    status: 'Processing', 
    type: 'submit',
    questionId,
    topic
  });
});

/**
 * @desc    Check result of a Judge0 token
 * @route   GET /api/coding/status/:token
 * @access  Private
 */
export const checkResult = asyncHandler(async (req, res) => {
  const { token } = req.params;
  
  // Try to retrieve context from Redis
  const context = await getFromCache(`env:execution:${token}`);
  const userId = req.user._id;

  const result = await getJudgeResult(token);

  if (result.isProcessing) {
    return res.json(result);
  }

  // Cleanup cache once processed
  if (context) await removeFromCache(`env:execution:${token}`);

  // Fallback to query params if cache missed (for non-submit runs or older clients)
  const type = context?.type || req.query.type;
  const questionId = context?.questionId || req.query.questionId;

  // If it's a RUN request (testing visible cases)
  if (type === 'run') {
    const question = await CodingQuestion.findById(questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    if (result.status !== 'Accepted') {
       return res.json([{ 
          status: result.status,
          compile_output: result.compile_output,
          stderr: result.stderr,
          passed: false 
       }]);
    }

    const outputs = (result.stdout || '').split('CASE_RESULT_DELIMITER').map(s => s.trim()).filter(Boolean);
    const details = (question.visibleTestCases || []).map((testCase, idx) => {
      const actual = (outputs[idx] || '').replace(/\s/g, '');
      const expected = (testCase.expectedOutput || '').replace(/\s/g, '');
      return {
        input: testCase.input,
        expected: testCase.expectedOutput || '',
        actual: outputs[idx] || '',
        status: result.status,
        time: result.time,
        memory: result.memory,
        passed: actual === expected,
      };
    });
    return res.json(details);
  }

  // If it's a SUBMIT request (testing ALL cases + persisting results)
  if (type === 'submit') {
    const question = await CodingQuestion.findById(questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const allTestCases = [...(question.visibleTestCases || []), ...(question.hiddenTestCases || [])];
    
    // Use data from Redis context for submission
    const { code, language, topic } = context || {};

    if (result.status !== 'Accepted') {
      return res.json({
          success: false,
          status: result.status,
          compile_output: result.compile_output,
          stderr: result.stderr
      });
    }

    const outputs = (result.stdout || '').split('CASE_RESULT_DELIMITER').map(s => s.trim()).filter(Boolean);
    let passedCount = 0;
    const testCaseResults = allTestCases.map((testCase, idx) => {
      const actual = (outputs[idx] || '').replace(/\s/g, '');
      const expected = (testCase.expectedOutput || '').replace(/\s/g, '');
      const passed = actual === expected;
      if (passed) passedCount++;
      return { passed, input: testCase.input, expected: testCase.expectedOutput || '', actual: outputs[idx] || '' };
    });

    const isAccepted = passedCount === allTestCases.length;
    
    // Save submission to DB
    await Submission.create({
      user: userId,
      question: questionId,
      language: language || 'unknown',
      code: code || '// Code not retrieved from cache',
      status: isAccepted ? 'Accepted' : (result.status === 'Accepted' ? 'Wrong Answer' : result.status),
      passedCount,
      totalCount: allTestCases.length,
      runtime: result.time,
      memory: result.memory
    });

    // Dynamic Acceptance Rate Update
    const totalSubmissions = await Submission.countDocuments({ question: questionId });
    const acceptedSubmissions = await Submission.countDocuments({ question: questionId, status: 'Accepted' });
    const acceptanceRate = totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0;

    await CodingQuestion.findByIdAndUpdate(questionId, {
      acceptanceRate,
      submissionStats: { totalSubmissions, acceptedSubmissions }
    });

    const escapedTopic = topic ? topic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
    let progress = await UserCodingProgress.findOne({ 
      user: userId, 
      topic: { $regex: new RegExp(`^${escapedTopic}$`, 'i') } 
    });
    if (!progress) {
      progress = new UserCodingProgress({ user: userId, topic: topic });
    }

    progress.attempts += 1;
    if (isAccepted) {
      progress.solvedQuestions += 1;
      progress.lastSolvedAt = new Date();
      progress.streak += 1;
      if (!progress.solvedProblems.includes(questionId)) {
          progress.solvedProblems.push(questionId);
      }
    }
    progress.accuracy = Math.round((progress.solvedQuestions / progress.attempts) * 100);
    await progress.save();

    // Global Stats
    const user = await User.findById(userId);
    if (user) {
      if (isAccepted && !user.solvedProblems.some(id => id.toString() === questionId.toString())) {
          user.solvedProblems.push(questionId);
          user.streak = (user.streak || 0) + 1;
          user.lastSolvedAt = new Date();
      }
      await user.save();
    }

    return res.json({
      status: isAccepted ? 'Accepted' : (result.status === 'Accepted' ? 'Wrong Answer' : result.status),
      passed: passedCount,
      total: allTestCases.length,
      failedCases: isAccepted ? [] : testCaseResults.filter(r => !r.passed).slice(0, 1),
      visibleResults: testCaseResults.slice(0, question.visibleTestCases.length),
      progress,
    });
  }

  // Default fallback for any other result types
  return res.json(result);
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
  if (topic) {
    const escapedTopic = topic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.topic = { $regex: new RegExp(`^${escapedTopic}$`, 'i') };
  }

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
