const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/auth');

// Get order statistics (protected)
router.get('/stats', authMiddleware, orderController.getOrderStats);

// Get all orders with filters (protected)
router.get('/', authMiddleware, orderController.getOrders);

// Get single order (protected)
router.get('/:id', authMiddleware, orderController.getOrderById);

// Create new order (protected)
router.post('/', authMiddleware, orderController.createOrder);

// Update order (protected)
router.put('/:id', authMiddleware, orderController.updateOrder);

// Update order status (protected)
router.patch('/:id/status', authMiddleware, orderController.updateOrderStatus);

// Delete order (protected, admin only)
router.delete('/:id', authMiddleware, orderController.deleteOrder);

// Get orders by customer (protected)
router.get('/customer/:customerName', authMiddleware, orderController.getOrdersByCustomer);

module.exports = router;