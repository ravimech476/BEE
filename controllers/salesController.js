const { InvoiceToDelivery } = require('../models');
const { Op } = require('sequelize');

const salesController = {
  // Get all sales orders with pagination and filtering (read-only)
  getAllSales: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '', status = '', dateFrom = '', dateTo = '' } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      
      if (search) {
        where[Op.or] = [
          { invoice_number: { [Op.like]: `%${search}%` } }
        ];
      }

      if (status) {
        where.status = status;
      }

      if (dateFrom || dateTo) {
        where.invoice_date = {};
        if (dateFrom) where.invoice_date[Op.gte] = new Date(dateFrom);
        if (dateTo) where.invoice_date[Op.lte] = new Date(dateTo);
      }

      const { count, rows: sales } = await InvoiceToDelivery.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['invoice_date', 'DESC']]
      });

      // Transform data to match expected format
      const transformedSales = sales.map(sale => ({
        id: sale.sl_no,
        invoice_number: sale.invoice_number,
        customer_name: 'N/A', // Not available in this table
        product_name: 'N/A', // Not available in this table
        amount: parseFloat(sale.invoice_value_inr?.toString().replace(/[^\d.-]/g, '') || 
                          sale.invoice_value?.toString().replace(/[^\d.-]/g, '') || 0),
        invoice_date: sale.invoice_date,
        status: sale.status,
        delivery_partner: sale.delivery_partner,
        delivered_date: sale.delivered_date,
        dispatch_date: sale.dispatch_date,
        lr_number: sale.lr_number
      }));

      res.json({
        sales: transformedSales,
        totalCount: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page)
      });
    } catch (error) {
      console.error('Error fetching sales orders:', error);
      res.status(500).json({ error: 'Failed to fetch sales orders' });
    }
  },

  // Get sale by ID (read-only)
  getSaleById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const sale = await InvoiceToDelivery.findByPk(id);

      if (!sale) {
        return res.status(404).json({ error: 'Sales order not found' });
      }

      // Transform data to match expected format
      const transformedSale = {
        id: sale.sl_no,
        invoice_number: sale.invoice_number,
        customer_name: 'N/A', // Not available in this table
        product_name: 'N/A', // Not available in this table
        amount: parseFloat(sale.invoice_value_inr?.toString().replace(/[^\d.-]/g, '') || 
                          sale.invoice_value?.toString().replace(/[^\d.-]/g, '') || 0),
        invoice_date: sale.invoice_date,
        status: sale.status,
        delivery_partner: sale.delivery_partner,
        delivered_date: sale.delivered_date,
        dispatch_date: sale.dispatch_date,
        lr_number: sale.lr_number
      };

      res.json(transformedSale);
    } catch (error) {
      console.error('Error fetching sales order:', error);
      res.status(500).json({ error: 'Failed to fetch sales order' });
    }
  },

  // Get sales statistics
  getSalesStats: async (req, res) => {
    try {
      const totalOrders = await InvoiceToDelivery.count();
      
      // Count by status
      const pendingOrders = await InvoiceToDelivery.count({ 
        where: { status: 'pending' } 
      });
      const deliveredOrders = await InvoiceToDelivery.count({ 
        where: { status: 'delivered' } 
      });
      const dispatchedOrders = await InvoiceToDelivery.count({ 
        where: { status: 'dispatched' } 
      });

      // Calculate total amount from invoice values
      let totalAmount = 0;
      try {
        const orders = await InvoiceToDelivery.findAll({
          attributes: ['invoice_value_inr', 'invoice_value'],
          where: {
            [Op.or]: [
              { invoice_value_inr: { [Op.ne]: null } },
              { invoice_value: { [Op.ne]: null } }
            ]
          }
        });
        
        totalAmount = orders.reduce((sum, order) => {
          const value = order.invoice_value_inr || order.invoice_value;
          const numericValue = parseFloat(value?.toString().replace(/[^\d.-]/g, '') || 0);
          return sum + (isNaN(numericValue) ? 0 : numericValue);
        }, 0);
      } catch (error) {
        console.error('Error calculating total amount:', error);
        totalAmount = 0;
      }

      // Get this month's orders
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const thisMonthOrders = await InvoiceToDelivery.count({
        where: {
          invoice_date: {
            [Op.gte]: currentMonth
          }
        }
      });

      // Calculate this month's amount
      let thisMonthAmount = 0;
      try {
        const thisMonthOrdersData = await InvoiceToDelivery.findAll({
          attributes: ['invoice_value_inr', 'invoice_value'],
          where: {
            invoice_date: {
              [Op.gte]: currentMonth
            },
            [Op.or]: [
              { invoice_value_inr: { [Op.ne]: null } },
              { invoice_value: { [Op.ne]: null } }
            ]
          }
        });
        
        thisMonthAmount = thisMonthOrdersData.reduce((sum, order) => {
          const value = order.invoice_value_inr || order.invoice_value;
          const numericValue = parseFloat(value?.toString().replace(/[^\d.-]/g, '') || 0);
          return sum + (isNaN(numericValue) ? 0 : numericValue);
        }, 0);
      } catch (error) {
        console.error('Error calculating this month amount:', error);
        thisMonthAmount = 0;
      }

      res.json({
        totalOrders,
        pendingOrders,
        completedOrders: deliveredOrders, // Map delivered to completed for compatibility
        dispatchedOrders,
        cancelledOrders: 0, // Not available in current schema
        totalAmount,
        thisMonthOrders,
        thisMonthAmount
      });
    } catch (error) {
      console.error('Error fetching sales statistics:', error);
      res.status(500).json({ error: 'Failed to fetch sales statistics' });
    }
  },

  // Get sales summary by month
  getSalesSummary: async (req, res) => {
    try {
      const { year = new Date().getFullYear() } = req.query;
      
      const salesByMonth = await InvoiceToDelivery.findAll({
        attributes: [
          [InvoiceToDelivery.sequelize.fn('MONTH', InvoiceToDelivery.sequelize.col('invoice_date')), 'month'],
          [InvoiceToDelivery.sequelize.fn('COUNT', InvoiceToDelivery.sequelize.col('sl_no')), 'count']
        ],
        where: {
          invoice_date: {
            [Op.gte]: new Date(`${year}-01-01`),
            [Op.lt]: new Date(`${parseInt(year) + 1}-01-01`)
          }
        },
        group: [InvoiceToDelivery.sequelize.fn('MONTH', InvoiceToDelivery.sequelize.col('invoice_date'))],
        order: [[InvoiceToDelivery.sequelize.fn('MONTH', InvoiceToDelivery.sequelize.col('invoice_date')), 'ASC']]
      });

      res.json(salesByMonth);
    } catch (error) {
      console.error('Error fetching sales summary:', error);
      res.status(500).json({ error: 'Failed to fetch sales summary' });
    }
  }
};

module.exports = salesController;