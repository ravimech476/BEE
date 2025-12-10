const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { Order, MeetingMinute, MarketResearch, InvoiceToDelivery, Statement, sequelize } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Get customer's product list (for filters)
router.get('/:customerCode/products/list', authMiddleware, async (req, res) => {
  try {
    const { customerCode } = req.params;
    
    // Security check for customer users
    if (req.user.role === 'customer' && customerCode !== req.user.customer_code) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get distinct products from customer's purchase history
    const query = `
      SELECT DISTINCT description as product_name
      FROM [D2D}.[dbo].[d2d_sales]
      WHERE customer_code = :customerCode
        AND description IS NOT NULL
        AND description != ''
      ORDER BY description ASC
    `;

    const products = await sequelize.query(query, {
      replacements: { customerCode },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching customer products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

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
      FROM [D2D}.[dbo].[d2d_sales]
      WHERE customer_code = :customerCode`,
      {
        replacements: { customerCode: customerFilter },
        type: sequelize.QueryTypes.SELECT
      }
    );

    // Get dispatch count by matching d2d_sales.billing_doc_no with d2d_dispatch_entry.invoice_no
    const [dispatchStats] = await sequelize.query(
      `SELECT COUNT(DISTINCT s.billing_doc_no) as DispatchedCount
      FROM [D2D}.[dbo].[d2d_sales] s
      INNER JOIN [D2D}.[dbo].[d2d_dispatch_entry] d 
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

// Get customer-specific orders (from d2d_sales table)
router.get('/:customerCode/orders', authMiddleware, async (req, res) => {
  try {
    const { customerCode } = req.params;
    const { page = 1, limit = 10, search, status } = req.query;
    
    // Security check for customer users
    if (req.user.role === 'customer' && customerCode !== req.user.customer_code) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build WHERE conditions
    let whereConditions = [`customer_code = '${customerCode}'`];
    
    if (search) {
      whereConditions.push(`(
        customer_code LIKE '%${search}%' OR 
        customer_po_number LIKE '%${search}%' OR
        billing_doc_no LIKE '%${search}%' OR 
        description LIKE '%${search}%' OR
        CAST(qty AS VARCHAR) LIKE '%${search}%' OR
        CAST(basis_rate_inr AS VARCHAR) LIKE '%${search}%' OR
        CONVERT(VARCHAR, bill_date, 23) LIKE '%${search}%' OR
        CONVERT(VARCHAR, due_date, 23) LIKE '%${search}%'
      )`);
    }
    
    if (status) {
      if (status === 'Over Due') {
        whereConditions.push(`due_date < CAST(GETDATE() AS DATE)`);
      } else if (status === 'Due') {
        whereConditions.push(`due_date = CAST(GETDATE() AS DATE)`);
      } else if (status === 'No Due') {
        whereConditions.push(`(due_date > CAST(GETDATE() AS DATE) OR due_date IS NULL)`);
      }
    }
    
    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM [D2D}.[dbo].[d2d_sales]
      ${whereClause}
    `;
    
    const [countResult] = await sequelize.query(countQuery, {
      type: sequelize.QueryTypes.SELECT
    });
    
    const totalItems = countResult.total;
    const totalPages = Math.ceil(totalItems / parseInt(limit));

    // Get paginated data
    const dataQuery = `
      SELECT 
        id,
        customer_code as CustomerCode,
        customer_po_number,
        billing_doc_no as Invoice,
        description as Product,
        qty as Quantity,
        basis_rate_inr as Amount,
        bill_date as BillDate,
        due_date,
        CASE
        WHEN date_of_realisation IS NOT NULL AND date_of_realisation <> '' THEN 'No Due'
        WHEN date_of_realisation IS NULL 
             AND CAST(GETDATE() AS DATE) <= Due_Date THEN 'Due'
        WHEN date_of_realisation IS NULL AND CAST(GETDATE() AS DATE) > Due_Date THEN 
            'Overdue - ' + CAST(DATEDIFF(DAY, Due_Date, CAST(GETDATE() AS DATE)) AS VARCHAR(10)) + ' Days'
        ELSE 'No Due'
    END AS Status
      FROM [D2D}.[dbo].[d2d_sales]
      ${whereClause}
      ORDER BY bill_date DESC
      OFFSET ${offset} ROWS
      FETCH NEXT ${parseInt(limit)} ROWS ONLY
    `;

    const orders = await sequelize.query(dataQuery, {
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        orders,
        total: totalItems,
        totalPages: totalPages,
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

// Get specific order details for customer
router.get('/:customerCode/orders/:id', authMiddleware, async (req, res) => {
  try {
    const { customerCode, id } = req.params;
    
    // Security check for customer users
    if (req.user.role === 'customer' && customerCode !== req.user.customer_code) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const order = await Order.findOne({
      where: { 
        id: id,
        customer_code: customerCode
      }
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      data: order
    });
    
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      error: error.message
    });
  }
});

// Get customer-specific meetings (filtered by customer_code)
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

    // Build where condition - filter by customer_code
    let whereCondition = {
      customer_code: customerCode
    };

    if (search) {
      whereCondition[Op.and] = [
        { customer_code: customerCode },
        {
          [Op.or]: [
            { title: { [Op.like]: `%${search}%` } },
            { agenda: { [Op.like]: `%${search}%` } },
            { minutes: { [Op.like]: `%${search}%` } },
            { mom_number: { [Op.like]: `%${search}%` } }
          ]
        }
      ];
      delete whereCondition.customer_code;
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

// Get specific meeting details for customer (only meetings assigned to them)
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
    
    // Find meeting by ID and customer_code
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

// Get customer-specific invoice to delivery data (JOIN query)
router.get('/:customerCode/invoice-to-delivery', authMiddleware, async (req, res) => {
  try {
    const { customerCode } = req.params;
    const { page = 1, limit = 10, search, status } = req.query;
    
    // Security check for customer users
    if (req.user.role === 'customer' && customerCode !== req.user.customer_code) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build WHERE conditions with customer filter
    let whereConditions = [`b.customer_code = '${customerCode}'`];
    
    if (search) {
      whereConditions.push(`(
        b.customer_code LIKE '%${search}%' OR 
        a.invoice_no LIKE '%${search}%' OR 
        a.waybill_no LIKE '%${search}%' OR
        a.trackingstatus LIKE '%${search}%'
      )`);
    }
    
    if (status) {
      whereConditions.push(`a.trackingstatus = '${status}'`);
    }
    
    const whereClause = 'WHERE ' + whereConditions.join(' AND ');

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM (
        SELECT DISTINCT  
          b.customer_code,
          a.invoice_no,
          b.bill_date,
          a.waybill_no,
          a.trackingstatus
        FROM [D2D}.[dbo].[d2d_dispatch_entry] a 
        INNER JOIN [D2D}.[dbo].[d2d_sales] b
          ON a.invoice_no = b.billing_doc_no
        ${whereClause}
        GROUP BY b.customer_code, a.invoice_no, b.bill_date, a.waybill_no, a.trackingstatus
      ) as CountTable
    `;
    
    const [countResult] = await sequelize.query(countQuery, {
      type: sequelize.QueryTypes.SELECT
    });
    
    const totalItems = countResult.total;
    const totalPages = Math.ceil(totalItems / parseInt(limit));

    // Get paginated data
    const dataQuery = `
      SELECT DISTINCT  
        b.customer_code,
        a.invoice_no,
        b.bill_date as InvoiceDate,
        SUM(b.basis_rate_inr) as Value,
        a.waybill_no as LRNumber,
        a.trackingstatus as Status
      FROM [D2D}.[dbo].[d2d_dispatch_entry] a 
      INNER JOIN [D2D}.[dbo].[d2d_sales] b
        ON a.invoice_no = b.billing_doc_no
      ${whereClause}
      GROUP BY b.customer_code, a.invoice_no, b.bill_date, a.waybill_no, a.trackingstatus
      ORDER BY b.bill_date DESC
      OFFSET ${offset} ROWS
      FETCH NEXT ${parseInt(limit)} ROWS ONLY
    `;

    const invoices = await sequelize.query(dataQuery, {
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        invoices,
        total: totalItems,
        totalPages: totalPages,
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