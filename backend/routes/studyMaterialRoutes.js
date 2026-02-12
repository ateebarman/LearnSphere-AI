import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect } from '../middleware/authMiddleware.js';
import StudyMaterial from '../models/StudyMaterial.js';
import { processPDF } from '../services/ragService.js';
import asyncHandler from 'express-async-handler';

const router = express.Router();

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/materials';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// @desc    Upload a study material
// @route   POST /api/study-materials/upload
// @access  Private
router.post('/upload', protect, upload.single('pdf'), asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const material = await StudyMaterial.create({
    user: req.user._id,
    fileName: req.file.originalname,
    fileUrl: req.file.path,
    status: 'processing',
    metadata: {
      fileSize: req.file.size
    }
  });

  // Start background processing
  processPDF(material._id).catch(err => {
    console.error(`Error processing PDF ${material._id}:`, err);
  });

  res.status(201).json(material);
}));

// @desc    Get user's study materials
// @route   GET /api/study-materials
// @access  Private
router.get('/', protect, asyncHandler(async (req, res) => {
  const materials = await StudyMaterial.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(materials);
}));

// @desc    Delete a study material
// @route   DELETE /api/study-materials/:id
// @access  Private
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const material = await StudyMaterial.findById(req.params.id);

  if (!material) {
    res.status(404);
    throw new Error('Material not found');
  }

  if (material.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  // Delete file from disk
  if (fs.existsSync(material.fileUrl)) {
    fs.unlinkSync(material.fileUrl);
  }

  await material.deleteOne();
  res.json({ message: 'Material removed' });
}));

export default router;
