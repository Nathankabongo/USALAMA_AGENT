import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  enable2FA,
  verify2FA
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body } from 'express-validator';

const router = Router();

// Validation schemas
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters long and contain only letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number'),
  body('profile.firstName')
    .notEmpty()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name is required and must be 2-50 characters long'),
  body('profile.lastName')
    .notEmpty()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name is required and must be 2-50 characters long')
];

const loginValidation = [
  body('identifier')
    .notEmpty()
    .withMessage('Email, phone, or username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number')
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number')
];

const updateProfileValidation = [
  body('profile.firstName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be 2-50 characters long'),
  body('profile.lastName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be 2-50 characters long'),
  body('preferences.language')
    .optional()
    .isIn(['fr', 'en', 'sw', 'ln'])
    .withMessage('Language must be one of: fr, en, sw, ln'),
  body('preferences.privacy.profileVisibility')
    .optional()
    .isIn(['public', 'friends', 'private'])
    .withMessage('Profile visibility must be one of: public, friends, private')
];

// Public routes
router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPasswordValidation, validateRequest, forgotPassword);
router.post('/reset-password', resetPasswordValidation, validateRequest, resetPassword);

// Protected routes
router.use(authenticate); // All routes below this require authentication

router.post('/logout', logout);
router.get('/me', getCurrentUser);
router.put('/profile', updateProfileValidation, validateRequest, updateProfile);
router.put('/change-password', changePasswordValidation, validateRequest, changePassword);
router.post('/enable-2fa', enable2FA);
router.post('/verify-2fa', verify2FA);

export default router;
