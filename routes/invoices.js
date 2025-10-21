const express = require('express');
const { body } = require('express-validator');
const invoiceController = require('../controllers/invoiceController');
const { authMiddleware, adminMiddleware, customerMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const logPageAccess = require('../middleware/pageLogger');

const router = express.Router();

// Validation rules
const invoiceValidation = [
  body('invoice_number')
    .notEmpty()
    .withMessage('Invoice number is required')
    .isLength({ max: 100 })
    .withMessage('Invoice number must not exceed 100 characters'),
  body('invoice_date')
    .notEmpty()
    .withMessage('Invoice date is required')
    .isISO8601()
    .withMessage('Invoice date must be a valid date'),
  body('status')
    .optional()
    .isIn(['pending', 'dispatched', 'delivered'])
    .withMessage('Status must be pending, dispatched, or delivered')
];

const statusUpdateValidation = [
  body('status')
    .isIn(['pending', 'dispatched', 'delivered'])
    .withMessage('Status must be pending, dispatched, or delivered'),
  body('delivered_date')
    .optional()
    .isISO8601()
    .withMessage('Delivered date must be a valid date')
];

// Apply authentication and page logging to all routes
router.use(authMiddleware);
router.use(customerMiddleware);
router.use(logPageAccess);

// Routes accessible by both admin and customer
router.get('/', invoiceController.getAllInvoices);
router.get('/stats', invoiceController.getInvoiceStats);
router.get('/:id', invoiceController.getInvoiceById);

// Admin only routes
router.post('/', adminMiddleware, invoiceValidation, validate, invoiceController.createInvoice);
router.put('/:id', adminMiddleware, invoiceValidation, validate, invoiceController.updateInvoice);
router.delete('/:id', adminMiddleware, invoiceController.deleteInvoice);
router.put('/:id/status', adminMiddleware, statusUpdateValidation, validate, invoiceController.updateDeliveryStatus);

module.exports = router;