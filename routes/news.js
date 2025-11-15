const express = require('express');
const { body } = require('express-validator');
const newsController = require('../controllers/newsController');
const { authMiddleware, adminMiddleware, customerMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const logPageAccess = require('../middleware/pageLogger');
const { uploadNewsImage, handleUploadError } = require('../middleware/newsImageUpload');

const router = express.Router();

// Validation rules
const newsValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 500 })
    .withMessage('Title must not exceed 500 characters'),
  body('content')
    .notEmpty()
    .withMessage('Content is required'),
  body('excerpt')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Excerpt must not exceed 1000 characters'),
  body('category')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Category must not exceed 100 characters'),
  body('display_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'draft'])
    .withMessage('Status must be active, inactive, or draft'),
  body('published_date')
    .optional()
    .isISO8601()
    .withMessage('Published date must be a valid date')
];

// Apply authentication and page logging to all routes
router.use(authMiddleware);
router.use(customerMiddleware);
router.use(logPageAccess);

// Routes accessible by both admin and customer
router.get('/', newsController.getAllNews);
router.get('/latest', newsController.getLatestNews);
router.get('/dashboard-news', newsController.getLatestNewsRaw);
router.get('/:id', newsController.getNewsById);

// Admin only routes with image upload
router.post('/', adminMiddleware, uploadNewsImage, handleUploadError, newsValidation, validate, newsController.createNews);
router.put('/:id', adminMiddleware, uploadNewsImage, handleUploadError, newsValidation, validate, newsController.updateNews);
router.delete('/:id', adminMiddleware, newsController.deleteNews);

module.exports = router;
