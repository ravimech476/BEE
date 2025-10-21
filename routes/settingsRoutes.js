const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authMiddleware } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Expert Settings Routes
router.get('/expert', settingsController.getExpertSettings);
router.put('/expert/email', settingsController.updateExpertEmail);

// Social Media Links Routes
router.get('/social-media', settingsController.getSocialMediaLinks);
router.post('/social-media', settingsController.addSocialMediaLink);
router.put('/social-media/:id', settingsController.updateSocialMediaLink);
router.delete('/social-media/:id', settingsController.deleteSocialMediaLink);
router.put('/social-media/reorder', settingsController.reorderSocialMediaLinks);

module.exports = router;