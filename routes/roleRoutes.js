const express = require('express');
const roleController = require('../controllers/roleController');
const { authMiddleware } = require('../middleware/auth');
const { requireAdmin, requirePermission } = require('../middleware/rbac');
const router = express.Router();

// Role management routes with CRUD permissions
router.get('/', authMiddleware, requirePermission('roles', 'view'), roleController.getAllRoles);
router.get('/active', authMiddleware, roleController.getActiveRoles); // Available to all authenticated users
router.get('/:id', authMiddleware, requirePermission('roles', 'view'), roleController.getRoleById);
router.post('/', authMiddleware, requirePermission('roles', 'add'), roleController.createRole);
router.put('/:id', authMiddleware, requirePermission('roles', 'edit'), roleController.updateRole);
router.delete('/:id', authMiddleware, requirePermission('roles', 'delete'), roleController.deleteRole);

module.exports = router;