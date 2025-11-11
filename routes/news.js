const express = require('express');
const { body } = require('express-validator');
const newsController = require('../controllers/newsController');
const { authMiddleware, adminMiddleware, customerMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const logPageAccess = require('../middleware/pageLogger');

const router = express.Router();

// Validation rules
const newsValidation = [
  body('news_number')
    .notEmpty()
    .withMessage('News number is required')
    .isLength({ max: 100 })
    .withMessage('News number must not exceed 100 characters'),
  body('news_name')
    .notEmpty()
    .withMessage('News name is required')
    .isLength({ max: 250 })
    .withMessage('News name must not exceed 250 characters'),
  body('news_title')
    .optional()
    .isLength({ max: 500 })
    .withMessage('News title must not exceed 500 characters'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
  body('priority')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Priority must be a non-negative integer')
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

// Admin only routes
router.post('/', adminMiddleware, newsValidation, validate, newsController.createNews);
router.put('/:id', adminMiddleware, newsValidation, validate, newsController.updateNews);
router.delete('/:id', adminMiddleware, newsController.deleteNews);

module.exports = router;