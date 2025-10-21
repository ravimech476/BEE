const { User, Role, Product, InvoiceToDelivery, MeetingMinute, MarketResearch, Statement } = require('../models');
const { Op } = require('sequelize');

const adminController = {
  // Get dashboard statistics
  getDashboardStats: async (req, res) => {
    try {
      // User statistics
      const totalUsers = await User.count();
      const activeUsers = await User.count({ where: { status: 'active' } });
      const adminUsers = await User.count({ where: { role: 'admin' } });

      // Product statistics
      const totalProducts = await Product.count();

      // Sales statistics - using correct column names
      const totalOrders = await InvoiceToDelivery.count();
      
      // For revenue, we'll try to parse invoice_value_inr or fall back to invoice_value
      let totalRevenue = 0;
      try {
        const revenueResult = await InvoiceToDelivery.findAll({
          attributes: ['invoice_value_inr', 'invoice_value'],
          where: {
            [Op.or]: [
              { invoice_value_inr: { [Op.ne]: null } },
              { invoice_value: { [Op.ne]: null } }
            ]
          }
        });
        
        totalRevenue = revenueResult.reduce((sum, record) => {
          // Try to parse invoice_value_inr first, then invoice_value
          const value = record.invoice_value_inr || record.invoice_value;
          const numericValue = parseFloat(value?.toString().replace(/[^\d.-]/g, '') || 0);
          return sum + (isNaN(numericValue) ? 0 : numericValue);
        }, 0);
      } catch (error) {
        console.error('Error calculating revenue:', error);
        totalRevenue = 0;
      }

      // Meeting statistics
      const totalMeetings = await MeetingMinute.count();
      const draftMeetings = await MeetingMinute.count({ where: { status: 'draft' } });

      // Market research statistics
      const totalReports = await MarketResearch.count();

      // Payment statistics - using correct column names
      const totalPayments = await Statement.count();
      
      let totalPaymentAmount = 0;
      try {
        const paymentResult = await Statement.sum('total_paid_amount');
        totalPaymentAmount = paymentResult || 0;
      } catch (error) {
        console.error('Error calculating payment amount:', error);
        totalPaymentAmount = 0;
      }

      // Recent activities (last 7 days)
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      const recentUsers = await User.count({
        where: {
          created_date: {
            [Op.gte]: lastWeek
          }
        }
      });

      const recentOrders = await InvoiceToDelivery.count({
        where: {
          invoice_date: {
            [Op.gte]: lastWeek
          }
        }
      });

      const recentMeetings = await MeetingMinute.count({
        where: {
          created_date: {
            [Op.gte]: lastWeek
          }
        }
      });

      // Monthly data for charts - simplified version
      const currentYear = new Date().getFullYear();
      const monthlyOrders = await InvoiceToDelivery.findAll({
        attributes: [
          [InvoiceToDelivery.sequelize.fn('MONTH', InvoiceToDelivery.sequelize.col('invoice_date')), 'month'],
          [InvoiceToDelivery.sequelize.fn('COUNT', InvoiceToDelivery.sequelize.col('sl_no')), 'count']
        ],
        where: {
          invoice_date: {
            [Op.gte]: new Date(`${currentYear}-01-01`),
            [Op.lt]: new Date(`${currentYear + 1}-01-01`)
          }
        },
        group: [InvoiceToDelivery.sequelize.fn('MONTH', InvoiceToDelivery.sequelize.col('invoice_date'))],
        order: [[InvoiceToDelivery.sequelize.fn('MONTH', InvoiceToDelivery.sequelize.col('invoice_date')), 'ASC']]
      });

      res.json({
        userStats: {
          total: totalUsers,
          active: activeUsers,
          admins: adminUsers,
          recent: recentUsers
        },
        productStats: {
          total: totalProducts
        },
        salesStats: {
          orders: totalOrders,
          revenue: totalRevenue,
          recentOrders: recentOrders
        },
        meetingStats: {
          total: totalMeetings,
          draft: draftMeetings,
          recent: recentMeetings
        },
        reportStats: {
          total: totalReports
        },
        paymentStats: {
          total: totalPayments,
          amount: totalPaymentAmount
        },
        monthlyData: monthlyOrders
      });
    } catch (error) {
      console.error('Error fetching dashboard statistics:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
  },

  // Get recent activities
  getRecentActivities: async (req, res) => {
    try {
      const { limit = 10 } = req.query;

      // Get recent users
      const recentUsers = await User.findAll({
        attributes: ['id', 'username', 'created_date'],
        order: [['created_date', 'DESC']],
        limit: parseInt(limit) / 2
      });

      // Get recent meetings
      const recentMeetings = await MeetingMinute.findAll({
        attributes: ['id', 'title', 'meeting_date', 'created_date'],
        include: [{
          model: User,
          as: 'creator',
          attributes: ['username']
        }],
        order: [['created_date', 'DESC']],
        limit: parseInt(limit) / 2
      });

      const activities = [
        ...recentUsers.map(user => ({
          type: 'user',
          title: `New user: ${user.username}`,
          date: user.created_date,
          id: user.id
        })),
        ...recentMeetings.map(meeting => ({
          type: 'meeting',
          title: `Meeting: ${meeting.title}`,
          date: meeting.created_date,
          id: meeting.id,
          creator: meeting.creator?.username
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, parseInt(limit));

      res.json(activities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      res.status(500).json({ error: 'Failed to fetch recent activities' });
    }
  },

  // Get system health check
  getSystemHealth: async (req, res) => {
    try {
      const dbStatus = 'connected'; // Since we're able to query, DB is connected
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();

      res.json({
        database: dbStatus,
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024)
        },
        uptime: Math.round(uptime / 60), // in minutes
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error fetching system health:', error);
      res.status(500).json({ error: 'Failed to fetch system health' });
    }
  }
};

module.exports = adminController;