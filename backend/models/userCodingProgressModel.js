import mongoose from 'mongoose';

const userCodingProgressSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    topic: {
      type: String,
      required: true,
    },
    solvedQuestions: {
      type: Number,
      default: 0,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    accuracy: {
      type: Number,
      default: 0,
    },
    streak: {
      type: Number,
      default: 0,
    },
    lastSolvedAt: {
      type: Date,
    },
    solvedProblems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CodingQuestion',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index for user and topic
userCodingProgressSchema.index({ user: 1, topic: 1 }, { unique: true });

const UserCodingProgress = mongoose.model('UserCodingProgress', userCodingProgressSchema);
export default UserCodingProgress;
