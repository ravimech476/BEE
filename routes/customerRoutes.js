const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { Order, MeetingMinute, MarketResearch, InvoiceToDelivery, Statement, sequelize } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Get customer-specific order statistics
router.get('/:customerCode/order-stats', authMiddleware, async (req, res) => {
  try {
    const { customerCode } = req.params;
    
    // Security check for customer users
    if (req.user.role === 'customer' && customerCode !== req.user.customer_code) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Build customer filter
    const customerFilter = req.user.role === 'customer' ? req.user.customer_code : customerCode;

    // Get order statistics from d2d_sales table
    const [orderStats] = await sequelize.query(
      `SELECT
         COUNT(DISTINCT id) AS TotalOrders,
        SUM(qty) AS TotalQuantity,
        SUM(net_amount) AS TotalValue
      FROM [customerconnect].[dbo].[d2d_sales]
      WHERE customer_code = :customerCode`,
      {
        replacements: { customerCode: customerFilter },
        type: sequelize.QueryTypes.SELECT
      }
    );

    // Get dispatch count by matching d2d_sales.billing_doc_no with d2d_dispatch_entry.invoice_no
    const [dispatchStats] = await sequelize.query(
      `SELECT COUNT(DISTINCT s.billing_doc_no) as DispatchedCount
      FROM [customerconnect].[dbo].[d2d_sales] s
      INNER JOIN [customerconnect].[dbo].[d2d_dispatch_entry] d 
        ON s.billing_doc_no = d.invoice_no
      WHERE s.customer_code = :customerCode`,
      {
        replacements: { customerCode: customerFilter },
        type: sequelize.QueryTypes.SELECT
      }
    );

    res.json({
      success: true,
      data: {
        total: parseInt(orderStats.TotalOrders) || 0,
        totalAmount: parseFloat(orderStats.TotalValue) || 0,
        totalQuantity: parseInt(orderStats.TotalQuantity) || 0,
        byStatus: {
          dispatched: parseInt(dispatchStats.DispatchedCount) || 0,
          pending: (parseInt(orderStats.TotalOrders) || 0) - (parseInt(dispatchStats.DispatchedCount) || 0)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching customer order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics',
      error: error.message
    });
  }
});

// Get customer-specific orders
router.get('/:customerCode/orders', authMiddleware, async (req, res) => {
  try {
    const { customerCode } = req.params;
    const { page = 1, limit = 10, search, status, sort = 'invoice_date', order = 'desc' } = req.query;
    
    // Add customer filter based on user type
    let whereCondition = {};
    if (req.user.role === 'customer') {
      whereCondition.customer_code = req.user.customer_code;
      if (customerCode !== req.user.customer_code) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    } else {
      whereCondition.customer_code = customerCode;
    }

    if (search) {
      whereCondition[Op.or] = [
        { invoice_number: { [Op.like]: `%${search}%` } },
        { product_name: { [Op.like]: `%${search}%` } },
        { customer_name: { [Op.like]: `%${search}%` } }
      ];
    }

    if (status && status !== 'all') {
      whereCondition.status = status;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit),
      offset: offset,
      order: [[sort, order.toUpperCase()]],
      attributes: [
        'id', 'invoice_number', 'customer_name', 'product_name', 
        'quantity', 'amount', 'status', 'invoice_date', 'delivery_date'
      ]
    });

    res.json({
      success: true,
      data: {
        orders,
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// Get customer-specific meetings
router.get('/:customerCode/meetings', authMiddleware, async (req, res) => {
  try {
    const { customerCode } = req.params;
    const { page = 1, limit = 10, search, sort = 'created_date', order = 'desc' } = req.query;
    
    // Security check for customer users
    if (req.user.role === 'customer' && customerCode !== req.user.customer_code) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Build where condition
    let whereCondition = { customer_code: customerCode };

    if (search) {
      whereCondition[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { agenda: { [Op.like]: `%${search}%` } },
        { minutes: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: meetings } = await MeetingMinute.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit),
      offset: offset,
      order: [[sort, order.toUpperCase()]],
      attributes: [
        'id', 'mom_number', 'title', 'meeting_date', 'agenda', 
        'minutes', 'attendees', 'action_items', 'next_meeting_date',
        'status', 'created_date'
      ]
    });

    // Transform data for frontend compatibility
    const transformedMeetings = meetings.map(meeting => ({
      id: meeting.id,
      meeting_title: meeting.title,
      meeting_description: meeting.minutes,
      meeting_date: meeting.meeting_date,
      title: meeting.title,
      agenda: meeting.agenda,
      attendees: meeting.attendees,
      attendees_count: Array.isArray(meeting.attendees) ? meeting.attendees.length : 0,
      action_items: meeting.action_items,
      next_meeting_date: meeting.next_meeting_date,
      status: meeting.status,
      mom_number: meeting.mom_number,
      created_date: meeting.created_date
    }));

    res.json({
      success: true,
      data: {
        meetings: transformedMeetings,
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
        currentPage: parseInt(page)
      }
    });
    
  } catch (error) {
    console.error('Error fetching customer meetings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meeting minutes',
      error: error.message
    });
  }
});

// Get specific meeting details for customer
router.get('/:customerCode/meetings/:id', authMiddleware, async (req, res) => {
  try {
    const { customerCode, id } = req.params;
    
    // Security check for customer users
    if (req.user.role === 'customer' && customerCode !== req.user.customer_code) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const meeting = await MeetingMinute.findOne({
      where: { 
        id: id,
        customer_code: customerCode
      }
    });
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Transform data for frontend
    const meetingDetail = {
      id: meeting.id,
      meeting_title: meeting.title,
      meeting_description: meeting.minutes,
      meeting_date: meeting.meeting_date,
      meeting_time: meeting.meeting_date ? new Date(meeting.meeting_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
      title: meeting.title,
      agenda: meeting.agenda,
      minutes: meeting.minutes,
      attendees: meeting.attendees,
      attendees_count: Array.isArray(meeting.attendees) ? meeting.attendees.length : 0,
      action_items: meeting.action_items,
      next_meeting_date: meeting.next_meeting_date,
      status: meeting.status,
      mom_number: meeting.mom_number,
      attachments: meeting.attachments,
      created_date: meeting.created_date
    };
    
    res.json({
      success: true,
      data: meetingDetail
    });
    
  } catch (error) {
    console.error('Error fetching meeting details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meeting details',
      error: error.message
    });
  }
});

// Get customer-specific market reports
router.get('/:customerCode/market-reports', authMiddleware, async (req, res) => {
  try {
    const { customerCode } = req.params;
    const { page = 1, limit = 10, search, sort = 'created_date', order = 'desc' } = req.query;
    
    // Security check for customer users
    if (req.user.role === 'customer' && customerCode !== req.user.customer_code) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Build where condition
    let whereCondition = { 
      customer_code: customerCode,
      status: 'active'
    };

    if (search) {
      whereCondition[Op.or] = [
        { research_title: { [Op.like]: `%${search}%` } },
        { research_name: { [Op.like]: `%${search}%` } },
        { research_short_description: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: reports } = await MarketResearch.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit),
      offset: offset,
      order: [[sort, order.toUpperCase()]],
      attributes: [
        'id', 'research_number', 'research_name', 'research_title',
        'research_short_description', 'research_long_description',
        'research_image1', 'research_image2', 'video_link', 
        'document', 'created_date', 'status'
      ]
    });

    res.json({
      success: true,
      data: {
        reports: reports,
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
        currentPage: parseInt(page)
      }
    });
    
  } catch (error) {
    console.error('Error fetching market reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch market reports',
      error: error.message
    });
  }
});

// Get specific market report details for customer
router.get('/:customerCode/market-reports/:id', authMiddleware, async (req, res) => {
  try {
    const { customerCode, id } = req.params;
    
    // Security check for customer users
    if (req.user.role === 'customer' && customerCode !== req.user.customer_code) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const report = await MarketResearch.findOne({
      where: { 
        id: id,
        customer_code: customerCode,
        status: 'active'
      }
    });
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Market report not found'
      });
    }
    
    res.json({
      success: true,
      data: report
    });
    
  } catch (error) {
    console.error('Error fetching market report details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch market report details',
      error: error.message
    });
  }
});

// Get customer-specific invoice to delivery data
router.get('/:customerCode/invoice-to-delivery', authMiddleware, async (req, res) => {
  try {
    const { customerCode } = req.params;
    const { page = 1, limit = 10, search, status, sort = 'invoice_date', order = 'desc' } = req.query;
    
    let whereCondition = {};
    if (req.user.role === 'customer') {
      whereCondition.customer_code = req.user.customer_code;
      if (customerCode !== req.user.customer_code) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    } else {
      whereCondition.customer_code = customerCode;
    }

    if (search) {
      whereCondition[Op.or] = [
        { invoice_number: { [Op.like]: `%${search}%` } },
        { product_name: { [Op.like]: `%${search}%` } }
      ];
    }

    if (status && status !== 'all') {
      whereCondition.delivery_status = status;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: invoiceDeliveries } = await InvoiceToDelivery.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit),
      offset: offset,
      order: [[sort, order.toUpperCase()]],
      attributes: [
        'id', 'invoice_number', 'product_name', 'quantity', 
        'amount', 'delivery_status', 'invoice_date', 'delivery_date'
      ]
    });

    res.json({
      success: true,
      data: {
        invoiceDeliveries,
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    console.error('Error fetching customer invoice to delivery data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice to delivery data',
      error: error.message
    });
  }
});

// Get customer-specific payment statements
router.get('/:customerCode/payments', authMiddleware, async (req, res) => {
  try {
    const { customerCode } = req.params;
    const { page = 1, limit = 10, search, status, sort = 'invoice_date', order = 'desc' } = req.query;
    
    // Security check for customer users
    if (req.user.role === 'customer' && customerCode !== req.user.customer_code) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Build where condition
    let whereCondition = { customer_code: customerCode };

    if (search) {
      whereCondition[Op.or] = [
        { invoice_number: { [Op.like]: `%${search}%` } },
        { customer_name: { [Op.like]: `%${search}%` } }
      ];
    }

    if (status && status !== 'all') {
      whereCondition.status = status;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: payments } = await Statement.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit),
      offset: offset,
      order: [[sort, order.toUpperCase()]],
      attributes: [
        'sl_no', 'customer_code', 'customer_name', 'customer_group',
        'outstanding_value', 'invoice_number', 'invoice_date', 
        'due_date', 'total_paid_amount', 'status', 'created_date'
      ]
    });

    // Transform data for frontend compatibility
    const transformedPayments = payments.map(payment => ({
      id: payment.sl_no,
      customer_name: payment.customer_name,
      customer_code: payment.customer_code,
      invoice_number: payment.invoice_number,
      statement_number: `STMT-${payment.sl_no}`,
      amount: parseFloat(payment.outstanding_value) || 0,
      payment_status: payment.status,
      payment_method: 'bank_transfer', // Default value
      reference_number: payment.invoice_number,
      statement_date: payment.invoice_date,
      due_date: payment.due_date,
      payment_date: payment.status === 'paid' ? payment.created_date : null,
      created_date: payment.created_date,
      paid_amount: parseFloat(payment.total_paid_amount) || 0,
      remaining_amount: parseFloat(payment.outstanding_value) - parseFloat(payment.total_paid_amount || 0)
    }));

    res.json({
      success: true,
      data: {
        payments: transformedPayments,
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
        currentPage: parseInt(page)
      }
    });
    
  } catch (error) {
    console.error('Error fetching customer payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment information',
      error: error.message
    });
  }
});

// Get specific payment details for customer
router.get('/:customerCode/payments/:id', authMiddleware, async (req, res) => {
  try {
    const { customerCode, id } = req.params;
    
    // Security check for customer users
    if (req.user.role === 'customer' && customerCode !== req.user.customer_code) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const payment = await Statement.findOne({
      where: { 
        sl_no: id,
        customer_code: customerCode
      }
    });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Transform data for frontend
    const paymentDetail = {
      id: payment.sl_no,
      customer_name: payment.customer_name,
      customer_code: payment.customer_code,
      customer_group: payment.customer_group,
      invoice_number: payment.invoice_number,
      statement_number: `STMT-${payment.sl_no}`,
      amount: parseFloat(payment.outstanding_value) || 0,
      payment_status: payment.status,
      payment_method: 'bank_transfer',
      reference_number: payment.invoice_number,
      statement_date: payment.invoice_date,
      due_date: payment.due_date,
      payment_date: payment.status === 'paid' ? payment.created_date : null,
      created_date: payment.created_date,
      paid_amount: parseFloat(payment.total_paid_amount) || 0,
      remaining_amount: parseFloat(payment.outstanding_value) - parseFloat(payment.total_paid_amount || 0),
      net_amount: parseFloat(payment.outstanding_value) || 0
    };
    
    res.json({
      success: true,
      data: paymentDetail
    });
    
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
      error: error.message
    });
  }
});

module.exports = router;