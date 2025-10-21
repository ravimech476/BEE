const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 100 })
    .withMessage('Username must be between 3 and 100 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('email_id')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('role')
    .optional()
    .isIn(['admin', 'customer'])
    .withMessage('Role must be either admin or customer')
];

const loginValidation = [
  body('username')
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const changePasswordValidation = [
  body('oldPassword')
    .notEmpty()
    .withMessage('Old password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

const updateProfileValidation = [
  body('email_id')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
];

// Routes
router.post('/register', registerValidation, validate, authController.register);
router.post('/login', loginValidation, validate, authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, updateProfileValidation, validate, authController.updateProfile);
router.put('/change-password', authMiddleware, changePasswordValidation, validate, authController.changePassword);
router.get('/my-role-permissions', authMiddleware, authController.getMyRolePermissions);

module.exports = router;