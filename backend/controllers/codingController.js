import asyncHandler from 'express-async-handler';
import CodingQuestion from '../models/codingQuestionModel.js';
import UserCodingProgress from '../models/userCodingProgressModel.js';
import { executeCode } from '../services/compilerService.js';
import { generateCodingQuestionFromAI } from '../services/codingGenerator.js';

/**
 * Wraps user code with a test driver if no entry point is detected.
 * Provides a robust fallback for older questions missing a testDriver.
 */
const wrapUserCode = (code, language, driver) => {
  const hasEntryPoint = {
    cpp: /int\s+main\s*\(|void\s+main\s*\(/.test(code),
    python: /if\s+__name__\s*==\s*['"]__main__['"]/.test(code),
    javascript: code.includes('process.stdin') || code.includes('fs.readFileSync(0)'),
  };

  if (hasEntryPoint[language]) return code;

  let wrapped = code;

  // Language specific wrapping
  if (language === 'cpp') {
    const headers = `#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n#include <map>\n#include <set>\n#include <queue>\n#include <stack>\n#include <cmath>\n#include <numeric>\nusing namespace std;\n\n`;
    wrapped = headers + code;
  }

  if (driver) {
    wrapped = wrapped + "\n\n" + driver;
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

  // Check if we already have questions for this topic
  let questions = await CodingQuestion.find({ topic: topic.toLowerCase() }).limit(5);

  // If less than 3 questions, generate a new one
  if (questions.length < 3) {
    const newQuestionData = await generateCodingQuestionFromAI(topic);
    const newQuestion = await CodingQuestion.create({
      topic: topic.toLowerCase(),
      ...newQuestionData,
    });
    questions.push(newQuestion);
  }

  res.json(questions);
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

  const results = [];
  const driver = question.testDriver?.[language];
  const finalCode = wrapUserCode(code, language, driver, question.title);

  for (const testCase of question.visibleTestCases) {
    const execution = await executeCode(finalCode, language, testCase.input, testCase.expectedOutput);
    results.push({
      input: testCase.input,
      expected: testCase.expectedOutput,
      actual: execution.stdout.trim(),
      status: execution.status,
      stderr: execution.stderr,
      compile_output: execution.compile_output,
      time: execution.time,
      memory: execution.memory,
      passed: execution.status === 'Accepted' || execution.stdout.trim() === testCase.expectedOutput.trim(),
    });
  }

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
  const driver = question.testDriver?.[language];
  const finalCode = wrapUserCode(code, language, driver, question.title);
  
  let passedCount = 0;
  const failedCases = [];

  for (const testCase of allTestCases) {
    const execution = await executeCode(finalCode, language, testCase.input, testCase.expectedOutput);
    const isPassed = execution.status === 'Accepted' || execution.stdout.trim() === testCase.expectedOutput.trim();
    
    if (isPassed) {
      passedCount++;
    } else {
      failedCases.push({
        input: testCase.input,
        expected: testCase.expectedOutput,
        actual: execution.stdout.trim(),
        status: execution.status,
        stderr: execution.stderr,
        compile_output: execution.compile_output,
      });
    }
  }

  const isAccepted = passedCount === allTestCases.length;

  let progress = await UserCodingProgress.findOne({ user: userId, topic: topic.toLowerCase() });
  if (!progress) {
    progress = new UserCodingProgress({ user: userId, topic: topic.toLowerCase() });
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

  res.json({
    status: isAccepted ? 'Accepted' : 'Failed',
    passed: passedCount,
    total: allTestCases.length,
    failedCases: isAccepted ? [] : failedCases.slice(0, 1),
    progress,
  });
});

// @desc    Get all coding problems with filtering and pagination
// @route   GET /api/coding/problems
// @access  Private
export const getProblems = asyncHandler(async (req, res) => {
  const { topic, difficulty, search, page = 1, limit = 20 } = req.query;
  const userId = req.user._id;

  const query = {};
  if (topic) query.topic = topic.toLowerCase();
  if (difficulty) query.difficulty = difficulty;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { topic: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;

  const [problems, total, userProgress] = await Promise.all([
    CodingQuestion.find(query)
      .select('title difficulty topic slug')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 }),
    CodingQuestion.countDocuments(query),
    UserCodingProgress.find({ user: userId }).select('solvedProblems')
  ]);

  const solvedSet = new Set(
    userProgress.flatMap(p => p.solvedProblems.map(id => id.toString()))
  );

  const problemsWithStatus = problems.map(p => ({
    ...p.toObject(),
    isSolved: solvedSet.has(p._id.toString())
  }));

  res.json({
    problems: problemsWithStatus,
    page: Number(page),
    pages: Math.ceil(total / limit),
    total
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
  if (topic) query.topic = topic.toLowerCase();

  const progress = await UserCodingProgress.find(query);
  res.json(progress);
});
