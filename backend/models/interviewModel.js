import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  stage: String,
  isFollowUp: Boolean,
  audioUrl: String,
});

const InterviewSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mode: { type: String, enum: ['mock', 'rapid', 'company', 'behavioral', 'technical', 'coding', 'resume'], default: 'mock' },
  company: { type: String, enum: ['google', 'amazon', 'microsoft', 'meta', 'startup', 'generic'], default: 'generic' },
  targetRole: { type: String, default: 'Software Engineer' },
  topic: String,
  stage: { type: String, default: 'INTRO' },
  status: { type: String, enum: ['PLANNED', 'ONGOING', 'COMPLETED', 'ABANDONED'], default: 'PLANNED' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'adaptive'], default: 'adaptive' },
  transcript: [MessageSchema],
  codingProblem: {
    title: String,
    description: String,
    difficulty: String,
    language: { type: String, default: 'javascript' },
    starterCode: String,
    solution: String,
    testCases: [{ input: String, output: String }],
  },
  evaluation: {
    overallScore: { type: Number, min: 0, max: 10 },
    technicalScore: { type: Number, min: 0, max: 10 },
    communicationScore: { type: Number, min: 0, max: 10 },
    problemSolvingScore: { type: Number, min: 0, max: 10 },
    confidenceScore: { type: Number, min: 0, max: 10 },
    hiringRecommendation: { type: String, enum: ['Strong Hire', 'Hire', 'No Hire', 'Strong No Hire'] },
    strengths: [String],
    weaknesses: [String],
    improvementSuggestions: [String],
    summary: String,
    topicScores: { type: Map, of: Number },
  },
  metadata: {
    resumeUsed: Boolean,
    voiceMode: { type: Boolean, default: false },
    durationSeconds: { type: Number, default: 0 },
    questionsAsked: { type: Number, default: 0 },
    followUpsAsked: { type: Number, default: 0 },
    hintsUsed: { type: Number, default: 0 },
  },
}, { timestamps: true });

const Interview = mongoose.models.Interview || mongoose.model('Interview', InterviewSchema);
export default Interview;
