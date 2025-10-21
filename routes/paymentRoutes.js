const express = require('express');
const paymentController = require('../controllers/paymentController');
const { authMiddleware } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const router = express.Router();

// Payment info routes with CRUD permissions
router.get('/', authMiddleware, requirePermission('payments', 'view'), paymentController.getAllPayments);
router.get('/stats', authMiddleware, requirePermission('payments', 'view'), paymentController.getPaymentStats);
router.get('/:id', authMiddleware, requirePermission('payments', 'view'), paymentController.getPaymentById);
router.post('/', authMiddleware, requirePermission('payments', 'add'), paymentController.createPayment);
router.put('/:id', authMiddleware, requirePermission('payments', 'edit'), paymentController.updatePayment);
router.delete('/:id', authMiddleware, requirePermission('payments', 'delete'), paymentController.deletePayment);

module.exports = router;