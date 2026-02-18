import asyncHandler from 'express-async-handler';
import CodingQuestion from '../models/codingQuestionModel.js';
import KnowledgeNode from '../models/knowledgeModel.js';
import Roadmap from '../models/roadmapModel.js';
import User from '../models/userModel.js';
import Submission from '../models/submissionModel.js';
import { executeCode } from '../services/compilerService.js';
import { generateCodingQuestionFromAI } from '../services/codingGenerator.js';
import { generateJson } from '../services/ai/index.js';
import { searchYouTubeVideos } from '../services/youtubeService.js';
import { getResourcesForTopic } from '../services/resourceDatabase.js';

// =============================================
// PROBLEM MANAGEMENT
// =============================================

// @desc    Get all problems (admin view with extra fields)
// @route   GET /api/admin/problems
// @access  Admin
export const getAdminProblems = asyncHandler(async (req, res) => {
  const problems = await CodingQuestion.find()
    .select('title difficulty topic slug acceptanceRate submissionStats validated createdAt')
    .sort({ createdAt: 1 });
  res.json(problems);
});

// @desc    Create a problem manually
// @route   POST /api/admin/problems
// @access  Admin
export const createProblem = asyncHandler(async (req, res) => {
  const problemData = req.body;

  // Validate required fields
  const required = ['title', 'problemStatement', 'difficulty', 'topic', 'starterCode', 'visibleTestCases'];
  for (const field of required) {
    if (!problemData[field]) {
      res.status(400);
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Generate slug if not provided
  if (!problemData.slug) {
    problemData.slug = problemData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // Check duplicate slug
  const existing = await CodingQuestion.findOne({ slug: problemData.slug });
  if (existing) {
    res.status(400);
    throw new Error('A problem with this slug already exists');
  }

  problemData.validated = true;
  const problem = await CodingQuestion.create(problemData);
  res.status(201).json(problem);
});

// @desc    Delete a problem
// @route   DELETE /api/admin/problems/:id
// @access  Admin
export const deleteProblem = asyncHandler(async (req, res) => {
  const problem = await CodingQuestion.findById(req.params.id);
  if (!problem) {
    res.status(404);
    throw new Error('Problem not found');
  }

  // Also clean up related submissions
  await Submission.deleteMany({ question: req.params.id });
  await CodingQuestion.findByIdAndDelete(req.params.id);

  res.json({ message: 'Problem and related submissions deleted' });
});

// @desc    AI Generate a problem (sandbox - not saved to DB yet)
// @route   POST /api/admin/problems/ai-generate
// @access  Admin
export const aiGenerateProblem = asyncHandler(async (req, res) => {
  const { topic, description = '' } = req.body;
  if (!topic) {
    res.status(400);
    throw new Error('Topic is required');
  }

  const questionData = await generateCodingQuestionFromAI(topic, description);
  // Return to admin for review — NOT saved to DB
  res.json({ preview: questionData });
});

// @desc    Validate an AI-generated problem by running reference solutions
// @route   POST /api/admin/problems/validate
// @access  Admin
export const validateProblem = asyncHandler(async (req, res) => {
  const { referenceSolution, judgeDriver, judgePreDriver, visibleTestCases, hiddenTestCases, starterCode } = req.body;

  if (!referenceSolution || !visibleTestCases) {
    res.status(400);
    throw new Error('Reference solution and test cases are required');
  }

  const allTestCases = [...(visibleTestCases || []), ...(hiddenTestCases || [])];
  const results = {};

  // Test each available language
  for (const lang of ['javascript', 'python', 'cpp']) {
    const solution = referenceSolution[lang];
    const driver = judgeDriver?.[lang];
    const preDriver = judgePreDriver?.[lang];

    if (!solution || !driver) {
      results[lang] = { status: 'skipped', reason: 'No solution or driver provided' };
      continue;
    }

    try {
      // Build full code: headers + preDriver + solution + driver
      let fullCode = '';

      if (lang === 'cpp') {
        fullCode += '#include <bits/stdc++.h>\nusing namespace std;\n\n';
      }
      if (preDriver) fullCode += preDriver + '\n\n';
      fullCode += solution + '\n\n';
      fullCode += driver;

      const batchInput = `${allTestCases.length}\n${allTestCases.map(tc => tc.input).join('\n')}`;
      const execution = await executeCode(fullCode, lang, batchInput);

      if (execution.status !== 'Accepted') {
        results[lang] = {
          status: 'failed',
          reason: execution.status,
          stderr: execution.stderr,
          compile_output: execution.compile_output
        };
        continue;
      }

      const outputs = execution.stdout.split('CASE_RESULT_DELIMITER').map(s => s.trim()).filter(Boolean);

      let passed = 0;
      const caseResults = allTestCases.map((tc, idx) => {
        const actual = (outputs[idx] || '').replace(/\s/g, '');
        const expected = tc.expectedOutput.replace(/\s/g, '');
        const match = actual === expected;
        if (match) passed++;
        return { input: tc.input, expected: tc.expectedOutput, actual: outputs[idx] || '', passed: match };
      });

      results[lang] = {
        status: passed === allTestCases.length ? 'all_passed' : 'partial_fail',
        passed,
        total: allTestCases.length,
        cases: caseResults,
        runtime: execution.time,
        memory: execution.memory
      };
    } catch (err) {
      results[lang] = { status: 'error', reason: err.message };
    }
  }

  const allPassed = Object.values(results).every(
    r => r.status === 'all_passed' || r.status === 'skipped'
  );

  res.json({ validated: allPassed, results });
});


// =============================================
// KNOWLEDGE BASE MANAGEMENT
// =============================================

// @desc    Get all knowledge entries (admin)
// @route   GET /api/admin/knowledge
// @access  Admin
export const getAdminKnowledge = asyncHandler(async (req, res) => {
  const nodes = await KnowledgeNode.find()
    .select('topic category summary createdAt updatedAt')
    .sort({ category: 1, topic: 1 });
  res.json(nodes);
});

// @desc    Create knowledge entry manually
// @route   POST /api/admin/knowledge
// @access  Admin
export const createKnowledge = asyncHandler(async (req, res) => {
  const {
    topic, category, summary, detailedContent,
    codeSnippets, implementations, keyPrinciples, commonPitfalls,
    complexity, verifiedResources, furtherReading,
    topicType, difficulty, tags, intuition
  } = req.body;

  if (!topic || !category || !summary || !detailedContent) {
    res.status(400);
    throw new Error('Topic, category, summary, and detailedContent are required');
  }

  const existing = await KnowledgeNode.findOne({ topic });
  if (existing) {
    res.status(400);
    throw new Error('Knowledge entry for this topic already exists');
  }

  const node = await KnowledgeNode.create({
    topic, category, summary, detailedContent,
    implementations: implementations || codeSnippets || [],
    codeSnippets: codeSnippets || implementations || [],
    keyPrinciples: keyPrinciples || [],
    commonPitfalls: commonPitfalls || [],
    complexity: complexity || {},
    verifiedResources: verifiedResources || [],
    furtherReading: furtherReading || verifiedResources || [],
    topicType: topicType || 'Concept',
    difficulty: difficulty || 'Intermediate',
    tags: tags || [],
    intuition: intuition || ''
  });
  res.status(201).json(node);
});

// @desc    AI Generate knowledge entry (preview)
// @route   POST /api/admin/knowledge/ai-generate
// @access  Admin
export const aiGenerateKnowledge = asyncHandler(async (req, res) => {
  const { topic, category } = req.body;
  if (!topic) {
    res.status(400);
    throw new Error('Topic is required');
  }

  const prompt = `
    You are a Senior Software Engineer creating a knowledge base entry for an interview preparation platform.
    Generate a comprehensive, interview-focused entry for the topic: "${topic}" in the category: "${category || 'General'}".
    
    Return a JSON object with ALL of these fields filled out properly:
    {
      "topic": "${topic}",
      "category": "${category || 'General'}",
      "topicType": "Concept" | "Algorithm" | "Theory" | "Design",
      "difficulty": "Beginner" | "Intermediate" | "Advanced",
      "summary": "A concise 2-3 sentence summary of the topic",
      "intuition": "An ELI5 / beginner-friendly analogy to understand this concept. Use real-world analogies. 2-4 sentences.",
      "detailedContent": "Full markdown content with sections: ## Overview, ## How It Works, ## When to Use, ## Implementation Details, ## Interview Tips, ## Common Questions. At least 500 words.",
      "tags": ["tag1", "tag2", "tag3", ...],
      "implementations": [
        { "language": "JavaScript", "code": "// clean, working implementation code", "explanation": "What this code does and why" },
        { "language": "Python", "code": "# clean, working implementation code", "explanation": "What this code does and why" }
      ],
      "keyPrinciples": ["principle 1", "principle 2", "principle 3", ...],
      "commonPitfalls": ["pitfall 1", "pitfall 2", "pitfall 3", ...],
      "complexity": { "time": "O(...)", "space": "O(...)" },
      "furtherReading": [
        { "title": "Official Documentation or well-known resource", "url": "https://real-url.com", "source": "external" },
        { "title": "Another trusted resource", "url": "https://real-url.com", "source": "external" }
      ]
    }

    IMPORTANT RULES:
    - The "topicType" should accurately classify the topic (Algorithm for sorting/searching, Concept for data structures, Theory for CS theory, Design for system design/patterns)
    - The "difficulty" should reflect how advanced the topic typically is
    - The "intuition" field should use a real-world analogy that makes the concept click instantly
    - Implementation code must be clean, correct, and well-commented
    - "tags" should include 4-8 relevant keywords for search
    - "furtherReading" URLs must be real, working links to official docs, MDN, GeeksforGeeks, or other trusted sources
    - Return ONLY valid JSON, no markdown fences
  `;

  const data = await generateJson(prompt);
  res.json({ preview: data });
});

// @desc    Delete a knowledge entry
// @route   DELETE /api/admin/knowledge/:id
// @access  Admin
export const deleteKnowledge = asyncHandler(async (req, res) => {
  const node = await KnowledgeNode.findById(req.params.id);
  if (!node) {
    res.status(404);
    throw new Error('Knowledge entry not found');
  }
  await KnowledgeNode.findByIdAndDelete(req.params.id);
  res.json({ message: 'Knowledge entry deleted' });
});


// =============================================
// ROADMAP MANAGEMENT
// =============================================

// @desc    Get all public/community roadmaps (admin)
// @route   GET /api/admin/roadmaps
// @access  Admin
export const getAdminRoadmaps = asyncHandler(async (req, res) => {
  const roadmaps = await Roadmap.find({ isPublic: true })
    .populate('user', 'name email')
    .select('title topic description difficulty user createdAt modules progress')
    .sort({ createdAt: -1 });
  res.json(roadmaps);
});

// @desc    Create a manual public roadmap (admin)
// @route   POST /api/admin/roadmaps
// @access  Admin
export const createAdminRoadmap = asyncHandler(async (req, res) => {
  const {
    title, topic, description, difficulty, totalDuration, modules,
    learningGoals, targetRoles, expectedOutcomes, skillsCovered, tags, prerequisites
  } = req.body;

  if (!title || !modules || modules.length === 0) {
    res.status(400);
    throw new Error('Title and at least one module are required');
  }

  const roadmap = await Roadmap.create({
    user: req.user._id,
    title,
    topic: topic || 'General',
    description,
    difficulty: difficulty || 'Intermediate',
    totalDuration,
    learningGoals: learningGoals || [],
    targetRoles: targetRoles || [],
    expectedOutcomes: expectedOutcomes || [],
    skillsCovered: skillsCovered || [],
    tags: tags || [],
    prerequisites: prerequisites || [],
    modules: (modules || []).map((m, i) => ({
      ...m,
      order: m.order ?? i,
      difficulty: m.difficulty || 'Intermediate',
      knowledgeRefs: m.knowledgeRefs || [],
      practiceProblems: m.practiceProblems || [],
      learningResources: m.learningResources || [],
      quizConfig: m.quizConfig || { autoGenerate: true, topic: m.title, questionCount: 5 },
      effortEstimate: m.effortEstimate || { readingMinutes: 30, practiceMinutes: 45, assessmentMinutes: 15 },
      interviewImportance: m.interviewImportance || 'Medium',
      conceptWeight: m.conceptWeight || 5,
      unlockCriteria: m.unlockCriteria || { masteryThreshold: 0, quizScore: 0, problemsSolved: 0 },
    })),
    isPublic: true,
  });

  res.status(201).json(roadmap);
});

// @desc    AI Generate a roadmap preview
// @route   POST /api/admin/roadmaps/ai-generate
// @access  Admin
export const aiGenerateRoadmap = asyncHandler(async (req, res) => {
  const { topic, difficulty, targetRole } = req.body;
  if (!topic) {
    res.status(400);
    throw new Error('Topic is required');
  }

  const prompt = `
    You are a World-Class Educational Architect and Career Coach creating an intelligent learning roadmap.
    Generate a comprehensive, structured roadmap for: "${topic}"
    ${difficulty ? `Target difficulty: ${difficulty}` : ''}
    ${targetRole ? `Target role: ${targetRole}` : ''}

    Return a JSON object with ALL fields filled:
    {
      "title": "Mastering ${topic}",
      "topic": "${topic}",
      "description": "A comprehensive, interview-focused learning path... (2-3 sentences)",
      "difficulty": "${difficulty || 'Intermediate'}",
      "totalDuration": "X Weeks",
      "learningGoals": ["Goal 1: ...", "Goal 2: ...", "Goal 3: ...", "Goal 4: ..."],
      "targetRoles": ["SDE-1", "Backend Engineer", ...],
      "expectedOutcomes": ["Outcome 1: ...", "Outcome 2: ...", "Outcome 3: ..."],
      "skillsCovered": ["Skill1", "Skill2", "Skill3", ...],
      "tags": ["tag1", "tag2", "tag3", ...],
      "prerequisites": ["Prerequisite 1", "Prerequisite 2", ...],
      "modules": [
        {
          "title": "Module Title (progressive naming like Foundations → Core → Advanced)",
          "description": "3-4 sentences on what this module covers and why",
          "estimatedTime": "X hours",
          "difficulty": "Beginner" | "Intermediate" | "Advanced",
          "objectives": ["Objective 1", "Objective 2", "Objective 3", "Objective 4"],
          "keyConcepts": ["Concept 1", "Concept 2", "Concept 3", "Concept 4", "Concept 5"],
          "practiceProblems": [
            { "title": "Problem Name", "url": "https://leetcode.com/problems/...", "difficulty": "Easy" | "Medium" | "Hard", "source": "external" },
            { "title": "Another Problem", "url": "https://geeksforgeeks.org/...", "difficulty": "Medium", "source": "external" }
          ],
          "learningResources": [
            { "title": "Official Documentation", "url": "https://real-url.com/docs", "type": "doc", "source": "external" },
            { "title": "Tutorial Article", "url": "https://real-url.com/article", "type": "article", "source": "external" }
          ],
          "quizConfig": { "autoGenerate": true, "topic": "Module-specific topic for quiz", "questionCount": 5 },
          "effortEstimate": { "readingMinutes": 30, "practiceMinutes": 45, "assessmentMinutes": 15 },
          "interviewImportance": "Critical" | "High" | "Medium" | "Low",
          "conceptWeight": 1-10,
          "unlockCriteria": { "masteryThreshold": 60, "quizScore": 70, "problemsSolved": 2 }
        }
      ]
    }

    RULES:
    - Generate 5-8 modules in strictly progressive order (Foundations → Core Concepts → Intermediate → Advanced → Mastery)
    - Each module should build upon previous modules
    - "practiceProblems" URLs must be real LeetCode, GeeksforGeeks, or HackerRank problem links
    - "learningResources" URLs must be real documentation links (MDN, official docs, GeeksforGeeks)
    - "unlockCriteria" should progressively increase (first module: 0/0/0, last module: 80/80/3)
    - "interviewImportance" should reflect real interview frequency
    - "conceptWeight" should range from 3 (supplementary) to 10 (critical)
    - "effortEstimate" should be realistic (beginners need more reading, advanced need more practice)
    - "difficulty" per module should progress from Beginner to Advanced
    - Return ONLY valid JSON, no markdown fences
  `;

  const data = await generateJson(prompt);

  // ENRICH WITH REAL CONTENT (Post-AI Processing)
  const enrichedModules = await Promise.all(data.modules.map(async (module) => {
    // 1. Fetch real YouTube Videos
    const youtubeVideos = await searchYouTubeVideos(`${module.title} tutorial developer`, 2);
    
    // 2. Fetch static verified resources
    const staticResources = getResourcesForTopic(module.title);

    // 3. Search Internal Knowledge Entries
    const internalKnowledge = await KnowledgeNode.find({
      $or: [
        { topic: { $regex: new RegExp(module.title, 'i') } },
        { keywords: { $in: module.keyConcepts.map(k => new RegExp(k, 'i')) } }
      ]
    }).limit(2).select('topic slug summary');

    // 4. Search Internal Coding Problems
    const internalProblems = await CodingQuestion.find({
      $or: [
        { title: { $regex: new RegExp(module.title, 'i') } },
        { topic: { $in: module.keyConcepts.map(k => k.toLowerCase()) } }
      ]
    }).limit(2).select('title slug difficulty topic');

    // MERGE CONTENT
    const finalResources = [
      ...youtubeVideos,
      ...staticResources.slice(0, 2),
      ...internalKnowledge.map(k => ({
        title: `Internal: ${k.topic}`,
        url: `/knowledge/${k.slug}`,
        type: 'doc',
        source: 'internal'
      })),
      ...(module.learningResources || [])
    ].filter((v, i, a) => a.findIndex(t => t.url === v.url) === i); // Deduplicate

    const finalProblems = [
      ...internalProblems.map(p => ({
        title: `Internal: ${p.title}`,
        url: `/problems/${p.slug}`,
        difficulty: p.difficulty,
        source: 'internal'
      })),
      ...(module.practiceProblems || [])
    ].filter((v, i, a) => a.findIndex(t => t.url === v.url) === i); // Deduplicate

    return {
      ...module,
      learningResources: finalResources.slice(0, 6),
      practiceProblems: finalProblems.slice(0, 4)
    };
  }));

  res.json({ preview: { ...data, modules: enrichedModules } });
});

// @desc    Update an official roadmap
// @route   PUT /api/admin/roadmaps/:id
// @access  Admin
export const updateAdminRoadmap = asyncHandler(async (req, res) => {
  const roadmap = await Roadmap.findById(req.params.id);
  if (!roadmap) {
    res.status(404);
    throw new Error('Roadmap not found');
  }

  const {
    title, topic, description, difficulty, totalDuration, modules,
    learningGoals, targetRoles, expectedOutcomes, skillsCovered, tags, prerequisites
  } = req.body;

  roadmap.title = title || roadmap.title;
  roadmap.topic = topic || roadmap.topic;
  roadmap.description = description || roadmap.description;
  roadmap.difficulty = difficulty || roadmap.difficulty;
  roadmap.totalDuration = totalDuration || roadmap.totalDuration;
  roadmap.learningGoals = learningGoals || roadmap.learningGoals;
  roadmap.targetRoles = targetRoles || roadmap.targetRoles;
  roadmap.expectedOutcomes = expectedOutcomes || roadmap.expectedOutcomes;
  roadmap.skillsCovered = skillsCovered || roadmap.skillsCovered;
  roadmap.tags = tags || roadmap.tags;
  roadmap.prerequisites = prerequisites || roadmap.prerequisites;

  if (modules) {
    roadmap.modules = modules.map((m, i) => ({
      ...m,
      order: m.order ?? i,
      difficulty: m.difficulty || 'Intermediate',
      knowledgeRefs: m.knowledgeRefs || [],
      practiceProblems: m.practiceProblems || [],
      learningResources: m.learningResources || [],
      quizConfig: m.quizConfig || { autoGenerate: true, topic: m.title, questionCount: 5 },
      effortEstimate: m.effortEstimate || { readingMinutes: 30, practiceMinutes: 45, assessmentMinutes: 15 },
      interviewImportance: m.interviewImportance || 'Medium',
      conceptWeight: m.conceptWeight || 5,
      unlockCriteria: m.unlockCriteria || { masteryThreshold: 0, quizScore: 0, problemsSolved: 0 },
    }));
  }

  const updatedRoadmap = await roadmap.save();
  res.json(updatedRoadmap);
});

// @desc    AI Generate a single module (preview)
// @route   POST /api/admin/roadmaps/ai-generate-module
// @access  Admin
export const aiGenerateModule = asyncHandler(async (req, res) => {
  const { topic, difficulty, currentModuleCount = 0 } = req.body;
  if (!topic) {
    res.status(400);
    throw new Error('Topic is required');
  }

  const prompt = `
    Generate a highly detailed learning module for the topic: "${topic}".
    The roadmap already has ${currentModuleCount} modules. This module should fit as the next progressive step.
    Difficulty: ${difficulty || 'Intermediate'}

    Return a JSON object:
    {
      "title": "Clear Module Title",
      "description": "3-4 sentences on importance and scope",
      "estimatedTime": "X hours",
      "difficulty": "${difficulty || 'Intermediate'}",
      "objectives": ["Obj 1", "Obj 2", ...],
      "keyConcepts": ["Concept 1", "Concept 2", ...],
      "practiceProblems": [
        { "title": "Problem Title", "url": "https://leetcode.com/...", "difficulty": "Medium", "source": "external" }
      ],
      "learningResources": [
        { "title": "Reference link", "url": "https://...", "type": "doc", "source": "external" }
      ],
      "quizConfig": { "autoGenerate": true, "topic": "${topic}", "questionCount": 5 },
      "effortEstimate": { "readingMinutes": 30, "practiceMinutes": 45, "assessmentMinutes": 15 },
      "interviewImportance": "High",
      "conceptWeight": 7,
      "unlockCriteria": { "masteryThreshold": 60, "quizScore": 70, "problemsSolved": 1 }
    }
  `;

  const data = await generateJson(prompt);
  
  // Enrich with real content (YouTube + Internal)
  const youtubeVideos = await searchYouTubeVideos(`${topic} ${data.title} tutorial`, 1);
  const internalKnowledge = await KnowledgeNode.find({ topic: { $regex: new RegExp(topic, 'i') } }).limit(1).select('topic slug');
  const internalProblems = await CodingQuestion.find({ topic: topic.toLowerCase() }).limit(1).select('title slug difficulty');

  const finalResources = [
    ...youtubeVideos,
    ...internalKnowledge.map(k => ({ title: `Internal: ${k.topic}`, url: `/knowledge/${k.slug}`, type: 'doc', source: 'internal' })),
    ...(data.learningResources || [])
  ];

  const finalProblems = [
    ...internalProblems.map(p => ({ title: `Internal: ${p.title}`, url: `/problems/${p.slug}`, difficulty: p.difficulty, source: 'internal' })),
    ...(data.practiceProblems || [])
  ];

  res.json({ 
    preview: { 
      ...data, 
      learningResources: finalResources.slice(0, 4), 
      practiceProblems: finalProblems.slice(0, 3) 
    } 
  });
});

// @desc    Delete a community roadmap
// @route   DELETE /api/admin/roadmaps/:id
// @access  Admin
export const deleteRoadmap = asyncHandler(async (req, res) => {
  const roadmap = await Roadmap.findById(req.params.id);
  if (!roadmap) {
    res.status(404);
    throw new Error('Roadmap not found');
  }
  await Roadmap.findByIdAndDelete(req.params.id);
  res.json({ message: 'Roadmap deleted' });
});


// =============================================
// DASHBOARD STATS
// =============================================

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Admin
export const getAdminStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalProblems, totalSubmissions, totalKnowledge, totalRoadmaps] = await Promise.all([
    User.countDocuments(),
    CodingQuestion.countDocuments(),
    Submission.countDocuments(),
    KnowledgeNode.countDocuments(),
    Roadmap.countDocuments({ isPublic: true })
  ]);

  res.json({
    totalUsers,
    totalProblems,
    totalSubmissions,
    totalKnowledge,
    totalRoadmaps
  });
});
