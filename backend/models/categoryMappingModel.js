import mongoose from 'mongoose';

const categoryMappingSchema = mongoose.Schema(
  {
    tag: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    categories: [{
      type: String,
      required: true,
      enum: [
        'DSA', 'Web Development', 'AI/ML', 'System Design', 'General', 
        'OS', 'Networking', 'Database', 'Distributed Systems', 
        'Compiler Design', 'Languages', 'Security', 'Big Data', 
        'Cloud', 'DevOps', 'Emerging Tech', 'Embedded', 'Low Level'
      ]
    }],
    weight: {
      type: Number,
      default: 1, // Influence of this tag on the category progress
    }
  },
  {
    timestamps: true
  }
);

const CategoryMapping = mongoose.model('CategoryMapping', categoryMappingSchema);
export default CategoryMapping;
