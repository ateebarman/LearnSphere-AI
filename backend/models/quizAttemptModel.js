import mongoose from 'mongoose';

const quizAttemptSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    roadmap: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Roadmap',
    },
    moduleTitle: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    answers: [
      {
        question: String,
        selectedAnswer: String,
        correctAnswer: String,
        isCorrect: Boolean,
      },
    ],
    recommendations: String, // AI-generated feedback
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
quizAttemptSchema.index({ user: 1, roadmap: 1 }); // To check module completion status
quizAttemptSchema.index({ user: 1, createdAt: -1 }); // To fetch user history

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
export default QuizAttempt;