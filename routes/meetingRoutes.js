const express = require('express');
const meetingController = require('../controllers/meetingController');
const { authMiddleware } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const upload = require('../middleware/uploadMiddleware');
const parseFormDataFields = require('../middleware/parseFormData');
const router = express.Router();

// Meeting minutes routes with CRUD permissions
router.get('/', authMiddleware, requirePermission('meetings', 'view'), meetingController.getAllMeetings);
router.get('/stats', authMiddleware, requirePermission('meetings', 'view'), meetingController.getMeetingStats);
router.get('/:id', authMiddleware, requirePermission('meetings', 'view'), meetingController.getMeetingById);
router.post('/', authMiddleware, requirePermission('meetings', 'add'), upload.array('attachments', 10), parseFormDataFields, meetingController.createMeeting);
router.put('/:id', authMiddleware, requirePermission('meetings', 'edit'), upload.array('attachments', 10), parseFormDataFields, meetingController.updateMeeting);
router.delete('/:id', authMiddleware, requirePermission('meetings', 'delete'), meetingController.deleteMeeting);

module.exports = router;