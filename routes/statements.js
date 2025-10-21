const express = require('express');
const statementController = require('../controllers/statementController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const logPageAccess = require('../middleware/pageLogger');

const router = express.Router();

// Apply authentication and page logging to all routes
router.use(authMiddleware);
router.use(logPageAccess);

// Routes accessible by both admin and customer
router.get('/', statementController.getAllStatements);
router.get('/summary', statementController.getStatementSummary);
router.get('/:id', statementController.getStatementById);
router.get('/customer/:customerCode', statementController.getStatementsByCustomer);

module.exports = router;
