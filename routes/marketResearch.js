const express = require('express');
const { body } = require('express-validator');
const { marketResearchController, uploadFields } = require('../controllers/marketResearchController');
const { authMiddleware, adminMiddleware, customerMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const logPageAccess = require('../middleware/pageLogger');

const router = express.Router();

// Validation rules
const marketResearchValidation = [
  body('research_number')
    .notEmpty()
    .withMessage('Research number is required')
    .isLength({ max: 100 })
    .withMessage('Research number must not exceed 100 characters'),
  body('research_name')
    .notEmpty()
    .withMessage('Research name is required')
    .isLength({ max: 250 })
    .withMessage('Research name must not exceed 250 characters'),
  body('research_title')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Research title must not exceed 500 characters'),
  // body('video_link')
  //   .optional()
  //   .isURL()
  //   .withMessage('Video link must be a valid URL'),
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
router.get('/', marketResearchController.getAllMarketResearch);
router.get('/latest', marketResearchController.getLatestMarketResearch);
router.get('/:id', marketResearchController.getMarketResearchById);

// Admin only routes
router.post('/', adminMiddleware, uploadFields, marketResearchValidation, validate, marketResearchController.createMarketResearch);
router.put('/:id', adminMiddleware, uploadFields, marketResearchValidation, validate, marketResearchController.updateMarketResearch);
router.delete('/:id', adminMiddleware, marketResearchController.deleteMarketResearch);

module.exports = router;