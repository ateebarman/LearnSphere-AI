import mongoose from 'mongoose';

// === SUB-SCHEMAS ===

const resourceSchema = mongoose.Schema({
  title: String,
  type: { type: String, enum: ['video', 'article', 'doc', 'challenge', 'course'] },
  url: String,
  description: String,
  thumbnail: String,
  source: { type: String, enum: ['internal', 'external'], default: 'external' },
  knowledgeRef: { type: mongoose.Schema.Types.ObjectId, ref: 'KnowledgeNode' },
});

const practiceProblemSchema = mongoose.Schema({
  title: String,
  url: String,
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
  source: { type: String, enum: ['internal', 'external'], default: 'external' },
  problemRef: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingQuestion' },
});

const moduleSchema = mongoose.Schema({
  title: String,
  description: String,
  estimatedTime: String,
  order: { type: Number, default: 0 },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Intermediate' },

  // Learning Content
  objectives: [String],
  keyConcepts: [String],
  
  // Direct Knowledge Base Links
  knowledgeRefs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'KnowledgeNode' }],
  
  // Practice Problems (internal + external)
  practiceProblems: [practiceProblemSchema],
  
  // Learning Resources (videos, docs, articles — internal + external)
  resources: [resourceSchema],
  learningResources: [resourceSchema],

  // Quiz Configuration
  quizConfig: {
    autoGenerate: { type: Boolean, default: true },
    topic: String,
    questionCount: { type: Number, default: 5 },
  },

  // Effort Estimation
  effortEstimate: {
    readingMinutes: { type: Number, default: 30 },
    practiceMinutes: { type: Number, default: 45 },
    assessmentMinutes: { type: Number, default: 15 },
  },

  // Interview Signals
  interviewImportance: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], default: 'Medium' },
  conceptWeight: { type: Number, default: 5, min: 1, max: 10 },

  // Mastery-Aware Progression
  unlockCriteria: {
    masteryThreshold: { type: Number, default: 0 },
    quizScore: { type: Number, default: 0 },
    problemsSolved: { type: Number, default: 0 },
  },

  isCompleted: { type: Boolean, default: false },
});

const roadmapSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
    },
    topic: {
      type: String,
      default: 'General',
    },
    description: String,
    difficulty: String,
    totalDuration: String,

    // Enhanced Metadata
    learningGoals: [String],
    targetRoles: [String],
    expectedOutcomes: [String],
    skillsCovered: [String],
    tags: [String],
    prerequisites: [String],

    modules: [moduleSchema],
    progress: {
      type: Number,
      default: 0,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    sourceMaterial: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyMaterial',
    },
  },

  {
    timestamps: true,
  }
);

// Index for fetching user's roadmaps quickly (sorted by newest)
roadmapSchema.index({ user: 1, createdAt: -1 });

const Roadmap = mongoose.model('Roadmap', roadmapSchema);
export default Roadmap;