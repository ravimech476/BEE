const express = require('express');
const { body } = require('express-validator');
const { marketResearchController, uploadFields } = require('../controllers/marketResearchController');
const { authMiddleware, adminMiddleware, customerMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const logPageAccess = require('../middleware/pageLogger');

const router = express.Router();

// Validation rules for CREATE - research_number and research_name are optional (auto-generated)
const createMarketResearchValidation = [
  body('research_title')
    .notEmpty()
    .withMessage('Research title is required')
    .isLength({ max: 500 })
    .withMessage('Research title must not exceed 500 characters'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
  body('priority')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Priority must be a non-negative integer')
];

// Validation rules for UPDATE - only title is required
const updateMarketResearchValidation = [
  body('research_title')
    .notEmpty()
    .withMessage('Research title is required')
    .isLength({ max: 500 })
    .withMessage('Research title must not exceed 500 characters')
];

// Apply authentication and page logging to all routes
router.use(authMiddleware);
router.use(customerMiddleware);
router.use(logPageAccess);

// Routes accessible by both admin and customer
router.get('/', marketResearchController.getAllMarketResearch);
router.get('/latest', marketResearchController.getLatestMarketResearch);
router.get('/:id', marketResearchController.getMarketResearchById);

// Admin only routes
router.post('/', adminMiddleware, uploadFields, createMarketResearchValidation, validate, marketResearchController.createMarketResearch);
router.put('/:id', adminMiddleware, uploadFields, updateMarketResearchValidation, validate, marketResearchController.updateMarketResearch);
router.delete('/:id', adminMiddleware, marketResearchController.deleteMarketResearch);

module.exports = router;
