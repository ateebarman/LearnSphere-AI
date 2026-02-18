import mongoose from 'mongoose';

// Implementation / Code Snippet sub-schema
const implementationSchema = mongoose.Schema({
  language: { type: String, required: true },
  code: { type: String, required: true },
  explanation: { type: String, default: '' }
}, { _id: false });

// Prerequisite sub-schema
const prerequisiteSchema = mongoose.Schema({
  title: { type: String, required: true },
  entryId: { type: mongoose.Schema.Types.ObjectId, ref: 'KnowledgeNode', default: null }
}, { _id: false });

// Linked problem sub-schema
const linkedProblemSchema = mongoose.Schema({
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingQuestion', default: null },
  title: { type: String, required: true }
}, { _id: false });

// Resource sub-schema
const resourceSchema = mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, default: '' },
  type: { type: String, enum: ['doc', 'video', 'article', 'tutorial'], default: 'article' },
  source: { type: String, enum: ['internal', 'external'], default: 'external' },
  knowledgeRef: { type: mongoose.Schema.Types.ObjectId, ref: 'KnowledgeNode', default: null }
}, { _id: false });

const knowledgeNodeSchema = mongoose.Schema(
  {
    // =========================
    // BASIC INFO
    // =========================
    topic: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,  // allows null for old docs
      index: true
    },
    category: {
      type: String,
      required: true,
      enum: [
        'DSA', 'Web Development', 'AI/ML', 'System Design', 'General',
        'OS', 'Networking', 'Database', 'Distributed Systems',
        'Compiler Design', 'Languages', 'Security', 'Big Data',
        'Cloud', 'DevOps', 'Emerging Tech', 'Embedded', 'Low Level',
        'DBMS'
      ]
    },
    topicType: {
      type: String,
      enum: ['Concept', 'Algorithm', 'Theory', 'Design'],
      default: 'Concept'
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate'
    },
    tags: {
      type: [String],
      default: []
    },
    keywords: {
      type: [String],
      default: []
    },

    // =========================
    // LEARNING CONTENT
    // =========================
    summary: {
      type: String,
      required: true
    },
    intuition: {
      type: String,
      default: ''
    },
    detailedContent: {
      type: String,
      required: true
    },
    estimatedReadTime: {
      type: Number,
      default: 5  // minutes
    },

    // =========================
    // STRUCTURED LEARNING BLOCKS
    // =========================
    keyPrinciples: [String],
    commonPitfalls: [String],

    // =========================
    // IMPLEMENTATION EXAMPLES
    // (backward-compatible: also keeps old codeSnippets)
    // =========================
    implementations: [implementationSchema],
    // Keep old field for backward compatibility
    codeSnippets: [implementationSchema],

    // =========================
    // COMPLEXITY
    // =========================
    complexity: {
      time: { type: String, default: '' },
      space: { type: String, default: '' }
    },

    // =========================
    // LEARNING GRAPH
    // =========================
    prerequisites: [prerequisiteSchema],
    relatedTopics: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KnowledgeNode'
    }],
    nextTopic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KnowledgeNode',
      default: null
    },
    previousTopic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KnowledgeNode',
      default: null
    },

    // =========================
    // PRACTICE INTEGRATION
    // =========================
    linkedProblems: [linkedProblemSchema],
    linkedQuizzes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      default: undefined
    }],

    // =========================
    // PLATFORM INTELLIGENCE
    // =========================
    importanceScore: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 10
    },
    interviewFrequency: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    },
    conceptWeight: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 1
    },

    // =========================
    // SEARCH + AI (RAG READY)
    // =========================
    embedding: {
      type: [Number],
      default: undefined
    },
    searchableText: {
      type: String,
      default: ''
    },

    // =========================
    // RESOURCES
    // =========================
    verifiedResources: [resourceSchema],
    furtherReading: [resourceSchema],

    // =========================
    // ANALYTICS
    // =========================
    stats: {
      views: { type: Number, default: 0 },
      completions: { type: Number, default: 0 },
      avgReadTime: { type: Number, default: 0 }
    },

    // =========================
    // SYSTEM
    // =========================
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    isPublished: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// ============================
// PRE-SAVE HOOKS
// ============================

// Auto-generate slug from topic if not set
knowledgeNodeSchema.pre('save', function (next) {
  if (!this.slug && this.topic) {
    this.slug = this.topic
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // Auto-generate searchableText from content fields
  if (!this.searchableText || this.isModified('topic') || this.isModified('summary') || this.isModified('detailedContent')) {
    this.searchableText = [
      this.topic,
      this.category,
      this.summary,
      ...(this.tags || []),
      ...(this.keywords || []),
      ...(this.keyPrinciples || []),
    ].filter(Boolean).join(' ').toLowerCase();
  }

  // Auto-calculate estimatedReadTime from content
  if (this.isModified('detailedContent') && this.detailedContent) {
    const wordCount = this.detailedContent.split(/\s+/).length;
    this.estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200)); // 200 wpm
  }

  // Merge codeSnippets into implementations for backward compat
  if (this.codeSnippets?.length > 0 && (!this.implementations || this.implementations.length === 0)) {
    this.implementations = this.codeSnippets;
  }

  next();
});

// Index for text search
knowledgeNodeSchema.index({ searchableText: 'text' });
knowledgeNodeSchema.index({ category: 1, importanceScore: -1 });
knowledgeNodeSchema.index({ interviewFrequency: 1 });

const KnowledgeNode = mongoose.model('KnowledgeNode', knowledgeNodeSchema);
export default KnowledgeNode;
