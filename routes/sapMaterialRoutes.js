const express = require('express');
const router = express.Router();
const sapMaterialController = require('../controllers/sapMaterialController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// GET /api/sap-materials/active - Get active SAP materials (for dropdown) - must be before /:id
router.get('/active', sapMaterialController.getActiveSapMaterials);

// GET /api/sap-materials - Get all SAP materials with pagination
router.get('/', sapMaterialController.getAllSapMaterials);

// GET /api/sap-materials/:id - Get single SAP material
router.get('/:id', sapMaterialController.getSapMaterialById);

// POST /api/sap-materials - Create new SAP material (Admin only)
router.post('/', adminMiddleware, sapMaterialController.createSapMaterial);

// PUT /api/sap-materials/:id - Update SAP material (Admin only)
router.put('/:id', adminMiddleware, sapMaterialController.updateSapMaterial);

// DELETE /api/sap-materials/:id - Delete SAP material (Admin only)
router.delete('/:id', adminMiddleware, sapMaterialController.deleteSapMaterial);

module.exports = router;
