import mongoose from 'mongoose';

const codingQuestionSchema = mongoose.Schema(
  {
    topic: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['Easy', 'Medium', 'Hard'],
      index: true,
    },
    problemStatement: {
      type: String,
      required: true,
    },
    constraints: [String],
    inputSchema: {
        type: mongoose.Schema.Types.Mixed,
        required: false,
        default: {}
    },
    outputSchema: {
        type: mongoose.Schema.Types.Mixed,
        required: false,
        default: {}
    },
    functionSignature: {
        methodName: String,
        parameters: [{
            name: { type: String, required: false },
            type: { type: String, required: false },
            _id: false
        }],
        returnType: String
    },
    examples: [
      {
        input: String,
        output: String,
        explanation: String,
      },
    ],
    starterCode: {
      javascript: String,
      python: String,
      cpp: String,
    },
    judgeDriver: {
      javascript: String,
      python: String,
      cpp: String,
    },
    judgePreDriver: {
      javascript: String,
      python: String,
      cpp: String,
    },
    referenceSolution: {
      javascript: String,
      python: String,
      cpp: String,
    },
    visibleTestCases: [
      {
        input: String,
        expectedOutput: String,
      },
    ],
    hiddenTestCases: [
      {
        input: String,
        expectedOutput: String,
      },
    ],
    validated: {
        type: Boolean,
        default: false
    },
    acceptanceRate: {
      type: Number,
      default: 0,
    },
    submissionStats: {
      totalSubmissions: { type: Number, default: 0 },
      acceptedSubmissions: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for common filter patterns
codingQuestionSchema.index({ topic: 1, difficulty: 1 });
codingQuestionSchema.index({ title: 'text' }); // For search functionality

codingQuestionSchema.pre('validate', function(next) {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

const CodingQuestion = mongoose.model('CodingQuestion', codingQuestionSchema);
export default CodingQuestion;
