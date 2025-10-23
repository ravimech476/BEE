const express = require('express');
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const { authMiddleware, adminMiddleware, customerMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const logPageAccess = require('../middleware/pageLogger');
const { uploadProductImages, handleUploadError } = require('../middleware/imageUpload');

const router = express.Router();

// Validation rules
const productValidation = [
  // body('product_number')
  //   .notEmpty()
  //   .withMessage('Product number is required')
  //   .isLength({ max: 100 })
  //   .withMessage('Product number must not exceed 100 characters'),
  // body('product_name')
  //   .notEmpty()
  //   .withMessage('Product name is required')
  //   .isLength({ max: 250 })
  //   .withMessage('Product name must not exceed 250 characters'),
  body('uom')
    .optional()
    .isLength({ max: 10 })
    .withMessage('UOM must not exceed 10 characters'),
  body('product_group')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Product group must not exceed 100 characters'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
  body('priority')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Priority must be a non-negative integer')
];

const bulkUpdateValidation = [
  body('productIds')
    .isArray({ min: 1 })
    .withMessage('Product IDs must be a non-empty array'),
  body('productIds.*')
    .isInt({ min: 1 })
    .withMessage('Each product ID must be a positive integer'),
  body('status')
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive')
];

// Apply authentication and page logging to all routes
router.use(authMiddleware);
router.use(customerMiddleware);
router.use(logPageAccess);

// Routes accessible by both admin and customer
router.get('/', productController.getAllProducts);
router.get('/top/by-sales', productController.getTopProductsBySales); // Add BEFORE /:id route
router.get('/groups', productController.getProductGroups);
router.get('/:id', productController.getProductById);

// Admin only routes
router.post('/', adminMiddleware, uploadProductImages, handleUploadError, productValidation, validate, productController.createProduct);
router.put('/:id', adminMiddleware, uploadProductImages, handleUploadError, productValidation, validate, productController.updateProduct);
router.delete('/:id', adminMiddleware, productController.deleteProduct);
router.put('/bulk/status', adminMiddleware, bulkUpdateValidation, validate, productController.bulkUpdateStatus);

module.exports = router;