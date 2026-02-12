import mongoose from 'mongoose';

const studyMaterialSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  fileName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    default: 'pdf',
  },
  fileUrl: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['uploading', 'processing', 'ready', 'error'],
    default: 'uploading',
  },
  vectorStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  metadata: {
    title: String,
    pageCount: Number,
    fileSize: Number,
    errorMessage: String,
  }
}, {
  timestamps: true,
});


const StudyMaterial = mongoose.model('StudyMaterial', studyMaterialSchema);

export default StudyMaterial;
