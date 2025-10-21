const express = require('express');
const salesController = require('../controllers/salesController');
const { authMiddleware } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const router = express.Router();

// Sales order routes with CRUD permissions (read-only but with granular view control)
router.get('/', authMiddleware, requirePermission('orders', 'view'), salesController.getAllSales);
router.get('/stats', authMiddleware, requirePermission('orders', 'view'), salesController.getSalesStats);
router.get('/summary', authMiddleware, requirePermission('orders', 'view'), salesController.getSalesSummary);
router.get('/:id', authMiddleware, requirePermission('orders', 'view'), salesController.getSaleById);

module.exports = router;