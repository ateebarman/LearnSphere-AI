import { body, validationResult } from 'express-validator';

// Validation middleware to check errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Auth validation
export const validateSignup = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors,
];

export const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

// Roadmap validation
export const validateRoadmap = [
  body('topic').trim().notEmpty().withMessage('Topic is required').isLength({ min: 2, max: 100 }).withMessage('Topic must be between 2 and 100 characters'),
  handleValidationErrors,
];

// Quiz validation
export const validateQuizGenerate = [
  body('moduleTitle').trim().notEmpty().withMessage('Module title is required'),
  body('topic').trim().notEmpty().withMessage('Topic is required'),
  handleValidationErrors,
];

export const validateQuizSubmit = [
  body('roadmapId').notEmpty().withMessage('Roadmap ID is required').custom((value) => {
    if (value === 'knowledge' || /^[0-9a-fA-F]{24}$/.test(value)) {
      return true;
    }
    throw new Error('Invalid roadmap ID');
  }),
  body('moduleTitle').trim().notEmpty().withMessage('Module title is required'),
  body('answers').isArray().withMessage('Answers must be an array'),
  body('questions').isArray().withMessage('Questions must be an array'),
  handleValidationErrors,
];
