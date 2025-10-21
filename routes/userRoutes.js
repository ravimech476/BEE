const express = require('express');
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');
const { requireAdmin, requirePermission } = require('../middleware/rbac');
const router = express.Router();

// User management routes with CRUD permissions
router.get('/', authMiddleware, requirePermission('users', 'view'), userController.getAllUsers);
router.get('/:id', authMiddleware, requirePermission('users', 'view'), userController.getUserById);
router.post('/', authMiddleware, requirePermission('users', 'add'), userController.createUser);
router.put('/:id', authMiddleware, requirePermission('users', 'edit'), userController.updateUser);
router.delete('/:id', authMiddleware, requirePermission('users', 'delete'), userController.deleteUser);
router.get('/:id/permissions', authMiddleware, requirePermission('users', 'view'), userController.getUserPermissions);

module.exports = router;