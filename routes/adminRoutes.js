const express = require('express');
const adminController = require('../controllers/adminController');
const { authMiddleware } = require('../middleware/auth');
const { requireAdmin, requirePermission } = require('../middleware/rbac');
const router = express.Router();

// Admin dashboard routes
router.get('/dashboard/stats', authMiddleware, requirePermission('dashboard', 'view'), adminController.getDashboardStats);
router.get('/dashboard/activities', authMiddleware, requirePermission('dashboard', 'view'), adminController.getRecentActivities);
router.get('/system/health', authMiddleware, requireAdmin, adminController.getSystemHealth);

module.exports = router;