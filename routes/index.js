const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./auth');
const productRoutes = require('./products');
const newsRoutes = require('./news');
const marketResearchRoutes = require('./marketResearch');
const invoiceRoutes = require('./invoices');
const userRoutes = require('./userRoutes');
const roleRoutes = require('./roleRoutes');
const meetingRoutes = require('./meetingRoutes');
const paymentRoutes = require('./paymentRoutes');
const salesRoutes = require('./salesRoutes');
const statementRoutes = require('./statements');
const adminRoutes = require('./adminRoutes');
const orderRoutes = require('./orders');
const invoiceToDeliveryRoutes = require('./invoiceToDelivery');
const settingsRoutes = require('./settingsRoutes');
const customerRoutes = require('./customerRoutes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Customer Connect API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/news', newsRoutes);
router.use('/market-research', marketResearchRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/orders', orderRoutes);
router.use('/invoice-to-delivery', invoiceToDeliveryRoutes);
router.use('/settings', settingsRoutes);
router.use('/customer', customerRoutes);

// Admin module routes
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/meetings', meetingRoutes);
router.use('/payments', paymentRoutes);
router.use('/sales', salesRoutes);
router.use('/statements', statementRoutes);

// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

module.exports = router;