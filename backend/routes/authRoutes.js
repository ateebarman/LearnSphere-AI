import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  deleteUserAccount,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateSignup, validateLogin } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.post('/signup', validateSignup, registerUser);
router.post('/login', validateLogin, loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/change-password', protect, changePassword);
router.delete('/profile', protect, deleteUserAccount);

export default router;