const express = require('express');
const router = express.Router();
const invoiceToDeliveryController = require('../controllers/invoiceToDeliveryController');
const { authMiddleware } = require('../middleware/auth');

// Get statistics (protected)
router.get('/stats', authMiddleware, invoiceToDeliveryController.getInvoiceToDeliveryStats);

// Get all invoice to deliveries with filters (protected)
router.get('/', authMiddleware, invoiceToDeliveryController.getInvoiceToDeliveries);

// Get single invoice to delivery (protected)
router.get('/:id', authMiddleware, invoiceToDeliveryController.getInvoiceToDeliveryById);

// Create new invoice to delivery (protected)
router.post('/', authMiddleware, invoiceToDeliveryController.createInvoiceToDelivery);

// Update invoice to delivery (protected)
router.put('/:id', authMiddleware, invoiceToDeliveryController.updateInvoiceToDelivery);

// Delete invoice to delivery (protected)
router.delete('/:id', authMiddleware, invoiceToDeliveryController.deleteInvoiceToDelivery);

module.exports = router;