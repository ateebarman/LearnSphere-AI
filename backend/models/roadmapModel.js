import mongoose from 'mongoose';

const resourceSchema = mongoose.Schema({
  title: String,
  type: { type: String, enum: ['video', 'article', 'doc', 'challenge'] },
  url: String,
  description: String,
  thumbnail: String,
});

const moduleSchema = mongoose.Schema({
  title: String,
  description: String,
  estimatedTime: String,
  objectives: [String],
  keyConcepts: [String],
  resources: [resourceSchema],
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

const Roadmap = mongoose.model('Roadmap', roadmapSchema);
export default Roadmap;