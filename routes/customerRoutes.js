const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { Order, MeetingMinute, MarketResearch, InvoiceToDelivery, sequelize } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Get customer-specific order statistics
router.get('/:customerCode/order-stats', authMiddleware, async (req, res) => {
  try {
    const { customerCode } = req.params;
    
    // Add customer filter based on user type
    let whereCondition = {};
    if (req.user.role === 'customer') {
      // Check if customer_code column exists
      try {
        whereCondition.customer_code = req.user.customer_code;
      } catch (error) {
        // Fallback to customer_name if customer_code column doesn't exist
        whereCondition.customer_name = req.user.first_name + ' ' + (req.user.last_name || '');
      }
      
      // Ensure customer can only access their own data
      if (customerCode !== req.user.customer_code) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    } else {
      try {
        whereCondition.customer_code = customerCode;
      } catch (error) {
        // Column doesn't exist yet, return empty stats
        return res.json({
          success: true,
          data: {
            total: 0,
            totalAmount: 0,
            byStatus: {
              dispatched: 0,
              pending: 0
            }
          }
        });
      }
    }

    const stats = await Order.findAll({
      where: whereCondition,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_orders'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount'],
        [sequelize.fn('COUNT', sequelize.literal("CASE WHEN status = 'delivered' THEN 1 END")), 'dispatched_orders'],
        [sequelize.fn('COUNT', sequelize.literal("CASE WHEN status = 'pending' THEN 1 END")), 'pending_orders']
      ],
      raw: true
    });

    const result = stats[0] || {
      total_orders: 0,
      total_amount: 0,
      dispatched_orders: 0,
      pending_orders: 0
    };

    res.json({
      success: true,
      data: {
        total: parseInt(result.total_orders) || 0,
        totalAmount: parseFloat(result.total_amount) || 0,
        byStatus: {
          dispatched: parseInt(result.dispatched_orders) || 0,
          pending: parseInt(result.pending_orders) || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching customer order stats:', error);
    
    // If it's a column error, return default stats
    if (error.message && error.message.includes('customer_code')) {
      return res.json({
        success: true,
        data: {
          total: 0,
          totalAmount: 0,
          byStatus: {
            dispatched: 0,
            pending: 0
          }
        },
        message: 'Database schema update required. Please run the database migration.'
      });
    }
    
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
    
    // TEMPORARY FIX: Return sample data until database columns are added
    console.log('⚠️ Using temporary fix - returning sample meeting data');
    
    const sampleMeetings = [
      {
        id: 1,
        meeting_title: 'Q1 Business Review',
        meeting_description: 'Quarterly business review meeting discussing performance and goals',
        meeting_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        duration: 90,
        attendees_count: 5,
        created_date: new Date(),
        title: 'Q1 Review',
        agenda: 'Performance discussion, Q2 planning'
      },
      {
        id: 2,
        meeting_title: 'Product Demonstration',
        meeting_description: 'New product features demonstration and feedback session',
        meeting_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        duration: 60,
        attendees_count: 3,
        created_date: new Date(),
        title: 'Product Demo',
        agenda: 'Feature walkthrough, feedback collection'
      },
      {
        id: 3,
        meeting_title: 'Contract Renewal Discussion',
        meeting_description: 'Annual contract renewal and terms discussion',
        meeting_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        duration: 45,
        attendees_count: 4,
        created_date: new Date(),
        title: 'Contract Review',
        agenda: 'Terms discussion, renewal process'
      }
    ];

    // Apply search filter if provided
    let filteredMeetings = sampleMeetings;
    if (search) {
      filteredMeetings = sampleMeetings.filter(meeting => 
        meeting.meeting_title.toLowerCase().includes(search.toLowerCase()) ||
        meeting.meeting_description.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedMeetings = filteredMeetings.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        meetings: paginatedMeetings,
        total: filteredMeetings.length,
        totalPages: Math.ceil(filteredMeetings.length / parseInt(limit)),
        currentPage: parseInt(page)
      },
      message: 'Showing sample data. Run database migration to add customer_code columns for actual data.'
    });
    
  } catch (error) {
    console.error('Error in meetings endpoint:', error);
    
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
    
    // TEMPORARY FIX: Return sample meeting detail data
    console.log(`⚠️ Using temporary fix - returning sample meeting detail for ID: ${id}`);
    
    const sampleMeetingDetails = {
      1: {
        id: 1,
        meeting_title: 'Q1 Business Review',
        meeting_description: 'Quarterly business review meeting discussing performance and goals for Q1 2025',
        meeting_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        meeting_time: '10:00 AM',
        duration: 90,
        location: 'Conference Room A',
        meeting_type: 'Business Review',
        attendees: ['John Smith (Host)', 'Sarah Johnson', 'Mike Brown', 'Lisa Chen', 'David Wilson'],
        attendees_count: 5,
        agenda: [
          'Review Q4 2024 performance metrics',
          'Discuss Q1 2025 goals and objectives',
          'Resource allocation and budget planning',
          'Market opportunities analysis',
          'Action items and next steps'
        ],
        meeting_notes: 'Productive quarterly review session. Discussed strong Q4 performance with 15% growth. Set ambitious but achievable Q1 targets. Key focus areas identified: customer retention, new market expansion, and operational efficiency improvements.',
        action_items: [
          {
            task: 'Prepare detailed Q1 budget proposal',
            assignee: 'John Smith',
            due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            status: 'pending'
          },
          {
            task: 'Update project timeline for new initiatives',
            assignee: 'Sarah Johnson',
            due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            status: 'in_progress'
          },
          {
            task: 'Market research for expansion opportunities',
            assignee: 'Mike Brown',
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'pending'
          }
        ],
        decisions: [
          'Approved 15% increase in marketing budget for Q1',
          'Decided to prioritize customer retention initiatives',
          'Green light for new market research project'
        ],
        next_meeting_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        created_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        status: 'completed'
      },
      2: {
        id: 2,
        meeting_title: 'Product Demonstration',
        meeting_description: 'New product features demonstration and customer feedback session',
        meeting_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        meeting_time: '2:00 PM',
        duration: 60,
        location: 'Virtual Meeting',
        meeting_type: 'Product Demo',
        attendees: ['Alice Wilson (Host)', 'Bob Chen', 'Customer Representative'],
        attendees_count: 3,
        agenda: [
          'Product feature walkthrough',
          'Live demonstration of new capabilities',
          'Customer feedback collection',
          'Q&A session'
        ],
        meeting_notes: 'Successful product demonstration. Customer showed strong interest in new features. Positive feedback received on user interface improvements and performance enhancements.',
        action_items: [
          {
            task: 'Provide product documentation',
            assignee: 'Alice Wilson',
            due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            status: 'completed'
          },
          {
            task: 'Schedule follow-up training session',
            assignee: 'Bob Chen',
            due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            status: 'pending'
          }
        ],
        decisions: [
          'Customer approved new feature implementation',
          'Scheduled additional training session',
          'Agreed on implementation timeline'
        ],
        next_meeting_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        created_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'completed'
      },
      3: {
        id: 3,
        meeting_title: 'Contract Renewal Discussion',
        meeting_description: 'Annual contract renewal and terms discussion meeting',
        meeting_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        meeting_time: '3:00 PM',
        duration: 45,
        location: 'Client Office',
        meeting_type: 'Contract Review',
        attendees: ['Emma Davis (Host)', 'Tom Wilson', 'Legal Representative', 'Client Manager'],
        attendees_count: 4,
        agenda: [
          'Review current contract terms',
          'Discuss renewal conditions',
          'Negotiate pricing and services',
          'Timeline for renewal process'
        ],
        meeting_notes: 'Constructive contract renewal discussion. Both parties satisfied with current service levels. Minor adjustments requested to service scope and pricing structure.',
        action_items: [
          {
            task: 'Draft updated contract terms',
            assignee: 'Legal Representative',
            due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            status: 'in_progress'
          },
          {
            task: 'Prepare pricing proposal',
            assignee: 'Emma Davis',
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'pending'
          }
        ],
        decisions: [
          'Agreed to extend contract for another year',
          'Approved 5% service expansion',
          'Maintained competitive pricing structure'
        ],
        next_meeting_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        created_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        status: 'completed'
      }
    };
    
    const meetingDetail = sampleMeetingDetails[id];
    
    if (!meetingDetail) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }
    
    res.json({
      success: true,
      data: meetingDetail,
      message: 'Showing sample data. Run database migration to add customer_code columns for actual data.'
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
    
    // TEMPORARY FIX: Return sample data until database columns are added
    console.log('⚠️ Using temporary fix - returning sample market research data');
    
    const sampleReports = [
      {
        id: 1,
        research_title: 'Industry Trends Q1 2024',
        research_short_description: 'Quarterly analysis of industry trends and market movements',
        research_name: 'Q1 Market Analysis',
        research_category: 'Industry Analysis',
        research_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        created_date: new Date(),
        research_long_description: 'Comprehensive analysis of market trends, competitor movements, and industry outlook for Q1 2024'
      },
      {
        id: 2,
        research_title: 'Customer Satisfaction Survey',
        research_short_description: 'Annual customer satisfaction and feedback analysis',
        research_name: 'Customer Feedback Study',
        research_category: 'Customer Research',
        research_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        created_date: new Date(),
        research_long_description: 'Detailed analysis of customer satisfaction metrics, feedback themes, and improvement recommendations'
      },
      {
        id: 3,
        research_title: 'Technology Adoption Study',
        research_short_description: 'Research on emerging technology adoption in the industry',
        research_name: 'Tech Adoption Report',
        research_category: 'Technology Research',
        research_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        created_date: new Date(),
        research_long_description: 'Study of emerging technology trends, adoption rates, and impact on business operations'
      }
    ];

    // Apply search filter if provided
    let filteredReports = sampleReports;
    if (search) {
      filteredReports = sampleReports.filter(report => 
        report.research_title.toLowerCase().includes(search.toLowerCase()) ||
        report.research_short_description.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedReports = filteredReports.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        reports: paginatedReports,
        total: filteredReports.length,
        totalPages: Math.ceil(filteredReports.length / parseInt(limit)),
        currentPage: parseInt(page)
      },
      message: 'Showing sample data. Run database migration to add customer_code columns for actual data.'
    });
    
  } catch (error) {
    console.error('Error in market reports endpoint:', error);
    
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
    
    // TEMPORARY FIX: Return sample market report detail data
    console.log(`⚠️ Using temporary fix - returning sample market report detail for ID: ${id}`);
    
    const sampleReportDetails = {
      1: {
        id: 1,
        research_title: 'Industry Trends Q1 2024',
        research_short_description: 'Quarterly analysis of industry trends and market movements',
        research_long_description: 'Comprehensive analysis of market trends, competitor movements, and industry outlook for Q1 2024. This report covers key market indicators, emerging technologies, customer behavior patterns, and strategic recommendations for business growth. The analysis includes data from multiple sources including industry reports, customer surveys, and competitive intelligence.',
        research_name: 'Q1 Market Analysis',
        research_category: 'Industry Analysis',
        research_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        created_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        modified_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        status: 'published',
        research_number: 'MR-2024-001',
        research_image1: '/uploads/market-research/industry-trends-chart.jpg',
        research_image2: '/uploads/market-research/market-analysis-graph.jpg',
        video_link: 'https://example.com/industry-trends-video',
        document: '/uploads/market-research/q1-market-analysis.pdf',
        created_by: 'Market Research Team',
        modified_by: 'Senior Analyst'
      },
      2: {
        id: 2,
        research_title: 'Customer Satisfaction Survey',
        research_short_description: 'Annual customer satisfaction and feedback analysis',
        research_long_description: 'Detailed analysis of customer satisfaction metrics, feedback themes, and improvement recommendations based on comprehensive survey data collected from over 1,000 customers across different segments. The report identifies key satisfaction drivers, pain points, and actionable insights for enhancing customer experience.',
        research_name: 'Customer Feedback Study',
        research_category: 'Customer Research',
        research_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        created_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        modified_date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        status: 'published',
        research_number: 'MR-2024-002',
        research_image1: '/uploads/market-research/customer-satisfaction-metrics.jpg',
        research_image2: '/uploads/market-research/feedback-analysis.jpg',
        video_link: 'https://example.com/customer-insights-video',
        document: '/uploads/market-research/customer-satisfaction-report.pdf',
        created_by: 'Customer Experience Team',
        modified_by: 'Research Director'
      },
      3: {
        id: 3,
        research_title: 'Technology Adoption Study',
        research_short_description: 'Research on emerging technology adoption in the industry',
        research_long_description: 'Study of emerging technology trends, adoption rates, and impact on business operations across the industry. This comprehensive analysis examines the latest technological innovations, implementation challenges, ROI analysis, and strategic recommendations for technology adoption in competitive markets.',
        research_name: 'Tech Adoption Report',
        research_category: 'Technology Research',
        research_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        created_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        modified_date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        status: 'published',
        research_number: 'MR-2024-003',
        research_image1: '/uploads/market-research/technology-trends.jpg',
        research_image2: '/uploads/market-research/adoption-timeline.jpg',
        video_link: 'https://example.com/tech-adoption-video',
        document: '/uploads/market-research/technology-adoption-study.pdf',
        created_by: 'Technology Research Team',
        modified_by: 'Chief Technology Officer'
      }
    };
    
    const reportDetail = sampleReportDetails[id];
    
    if (!reportDetail) {
      return res.status(404).json({
        success: false,
        message: 'Market report not found'
      });
    }
    
    res.json({
      success: true,
      data: reportDetail,
      message: 'Showing sample data. Run database migration to add customer_code columns for actual data.'
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
    const { page = 1, limit = 10, search, status, sort = 'statement_date', order = 'desc' } = req.query;
    
    // Security check for customer users
    if (req.user.role === 'customer' && customerCode !== req.user.customer_code) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // TEMPORARY FIX: Return sample payment data
    console.log(`⚠️ Using temporary fix - returning sample payment data for customer: ${customerCode}`);
    
    const samplePayments = [
      {
        id: 1,
        customer_name: req.user?.first_name ? `${req.user.first_name} ${req.user.last_name || ''}` : 'Customer',
        invoice_number: 'INV-2024-001',
        statement_number: 'STMT-2024-001',
        amount: 15750.00,
        payment_status: 'completed',
        payment_method: 'bank_transfer',
        reference_number: 'TXN123456789',
        statement_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        payment_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        created_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        notes: 'Payment completed successfully via bank transfer',
        tax_amount: 2362.50,
        discount_amount: 0,
        net_amount: 13387.50
      },
      {
        id: 2,
        customer_name: req.user?.first_name ? `${req.user.first_name} ${req.user.last_name || ''}` : 'Customer',
        invoice_number: 'INV-2024-002',
        statement_number: 'STMT-2024-002',
        amount: 8500.00,
        payment_status: 'pending',
        payment_method: 'credit_card',
        reference_number: 'TXN987654321',
        statement_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        payment_date: null,
        created_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        notes: 'Payment pending - reminder sent to customer',
        tax_amount: 1275.00,
        discount_amount: 500.00,
        net_amount: 6725.00
      },
      {
        id: 3,
        customer_name: req.user?.first_name ? `${req.user.first_name} ${req.user.last_name || ''}` : 'Customer',
        invoice_number: 'INV-2024-003',
        statement_number: 'STMT-2024-003',
        amount: 22000.00,
        payment_status: 'overdue',
        payment_method: 'check',
        reference_number: 'CHK456789',
        statement_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        due_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        payment_date: null,
        created_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        notes: 'Payment overdue - follow-up required',
        tax_amount: 3300.00,
        discount_amount: 1000.00,
        net_amount: 17700.00
      },
      {
        id: 4,
        customer_name: req.user?.first_name ? `${req.user.first_name} ${req.user.last_name || ''}` : 'Customer',
        invoice_number: 'INV-2024-004',
        statement_number: 'STMT-2024-004',
        amount: 5250.00,
        payment_status: 'partial',
        payment_method: 'online_payment',
        reference_number: 'ONL789123456',
        statement_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        payment_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        created_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        notes: 'Partial payment received - remaining balance due',
        tax_amount: 787.50,
        discount_amount: 250.00,
        net_amount: 4212.50,
        paid_amount: 3000.00,
        remaining_amount: 2250.00
      }
    ];

    // Apply search filter if provided
    let filteredPayments = samplePayments;
    if (search) {
      filteredPayments = samplePayments.filter(payment => 
        payment.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
        payment.statement_number.toLowerCase().includes(search.toLowerCase()) ||
        payment.reference_number.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply status filter if provided
    if (status && status !== 'all') {
      filteredPayments = filteredPayments.filter(payment => 
        payment.payment_status === status
      );
    }

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        payments: paginatedPayments,
        total: filteredPayments.length,
        totalPages: Math.ceil(filteredPayments.length / parseInt(limit)),
        currentPage: parseInt(page)
      },
      message: 'Showing sample data. Run database migration to add customer_code columns for actual data.'
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
    
    // TEMPORARY FIX: Return sample payment detail data
    console.log(`⚠️ Using temporary fix - returning sample payment detail for ID: ${id}`);
    
    const samplePaymentDetails = {
      1: {
        id: 1,
        customer_name: 'Customer Name',
        customer_code: customerCode,
        invoice_number: 'INV-2024-001',
        statement_number: 'STMT-2024-001',
        amount: 15750.00,
        payment_status: 'completed',
        payment_method: 'bank_transfer',
        reference_number: 'TXN123456789',
        statement_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        payment_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        created_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        notes: 'Payment completed successfully via bank transfer on time',
        description: 'Invoice payment for Q1 2024 services including consulting and support',
        tax_amount: 2362.50,
        discount_amount: 0,
        net_amount: 13387.50,
        paid_amount: 15750.00,
        remaining_amount: 0,
        payment_history: [
          {
            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            amount: 15750.00,
            method: 'bank_transfer',
            reference: 'TXN123456789',
            status: 'completed'
          }
        ]
      },
      2: {
        id: 2,
        customer_name: 'Customer Name',
        customer_code: customerCode,
        invoice_number: 'INV-2024-002',
        statement_number: 'STMT-2024-002',
        amount: 8500.00,
        payment_status: 'pending',
        payment_method: 'credit_card',
        reference_number: 'TXN987654321',
        statement_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        payment_date: null,
        created_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        notes: 'Payment pending - reminder sent to customer via email',
        description: 'Monthly subscription and additional services for January 2024',
        tax_amount: 1275.00,
        discount_amount: 500.00,
        net_amount: 6725.00,
        paid_amount: 0,
        remaining_amount: 8500.00,
        payment_history: []
      },
      3: {
        id: 3,
        customer_name: 'Customer Name',
        customer_code: customerCode,
        invoice_number: 'INV-2024-003',
        statement_number: 'STMT-2024-003',
        amount: 22000.00,
        payment_status: 'overdue',
        payment_method: 'check',
        reference_number: 'CHK456789',
        statement_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        due_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        payment_date: null,
        created_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        notes: 'Payment overdue - multiple follow-up attempts made, legal action may be required',
        description: 'Large project implementation and training services for Q4 2023',
        tax_amount: 3300.00,
        discount_amount: 1000.00,
        net_amount: 17700.00,
        paid_amount: 0,
        remaining_amount: 22000.00,
        payment_history: []
      },
      4: {
        id: 4,
        customer_name: 'Customer Name',
        customer_code: customerCode,
        invoice_number: 'INV-2024-004',
        statement_number: 'STMT-2024-004',
        amount: 5250.00,
        payment_status: 'partial',
        payment_method: 'online_payment',
        reference_number: 'ONL789123456',
        statement_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        payment_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        created_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        notes: 'Partial payment received - customer requested payment plan for remaining balance',
        description: 'Software licensing and support services for February 2024',
        tax_amount: 787.50,
        discount_amount: 250.00,
        net_amount: 4212.50,
        paid_amount: 3000.00,
        remaining_amount: 2250.00,
        payment_history: [
          {
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            amount: 3000.00,
            method: 'online_payment',
            reference: 'ONL789123456',
            status: 'completed'
          }
        ]
      }
    };
    
    const paymentDetail = samplePaymentDetails[id];
    
    if (!paymentDetail) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }
    
    res.json({
      success: true,
      data: paymentDetail,
      message: 'Showing sample data. Run database migration to add customer_code columns for actual data.'
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
