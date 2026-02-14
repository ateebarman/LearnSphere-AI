import mongoose from 'mongoose';

const knowledgeNodeSchema = mongoose.Schema(
  {
    topic: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    category: {
      type: String,
      required: true,
      enum: [
        'DSA', 'Web Development', 'AI/ML', 'System Design', 'General', 
        'OS', 'Networking', 'Database', 'Distributed Systems', 
        'Compiler Design', 'Languages', 'Security', 'Big Data', 
        'Cloud', 'DevOps', 'Emerging Tech', 'Embedded', 'Low Level'
      ]
    },
    summary: {
      type: String,
      required: true
    },
    detailedContent: {
      type: String,
      required: true
    },
    codeSnippets: [
      {
        language: String,
        code: String,
        explanation: String
      }
    ],
    keyPrinciples: [String],
    commonPitfalls: [String],
    complexity: {
      time: String,
      space: String
    },
    verifiedResources: [
      {
        title: String,
        url: String,
        type: { type: String, enum: ['doc', 'video', 'article'] }
      }
    ]
  },
  {
    timestamps: true
  }
);

const KnowledgeNode = mongoose.model('KnowledgeNode', knowledgeNodeSchema);
export default KnowledgeNode;
