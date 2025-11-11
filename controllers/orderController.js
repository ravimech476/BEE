const { Order, Product, User } = require('../models');
const { Op } = require('sequelize');

const orderController = {
  // Get all orders with pagination, search, and filters (from d2d_sales table)
  async getOrders(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        status = '',
        startDate,
        endDate 
      } = req.query;

      const offset = (page - 1) * limit;
      const sequelize = Order.sequelize;
      
      // Build WHERE conditions for search and filters
      let whereConditions = [];
      
      if (search) {
        whereConditions.push(`(
          customer_code LIKE '%${search}%' OR 
          billing_doc_no LIKE '%${search}%' OR 
          description LIKE '%${search}%' OR
          customer_po_number LIKE '%${search}%'
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
      
      if (startDate && endDate) {
        whereConditions.push(`bill_date BETWEEN '${startDate}' AND '${endDate}'`);
      }
      
      const whereClause = whereConditions.length > 0 
        ? 'WHERE ' + whereConditions.join(' AND ') 
        : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM [customerconnect].[dbo].[d2d_sales]
        ${whereClause}
      `;
      
      const [countResult] = await sequelize.query(countQuery, {
        type: sequelize.QueryTypes.SELECT
      });
      
      const totalItems = countResult.total;
      const totalPages = Math.ceil(totalItems / limit);

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
            WHEN due_date < CAST(GETDATE() AS DATE) THEN 'Over Due'
            WHEN due_date = CAST(GETDATE() AS DATE) THEN 'Due'
            WHEN due_date > CAST(GETDATE() AS DATE) THEN 'No Due'
            ELSE 'No Due'
          END AS Status
        FROM [customerconnect].[dbo].[d2d_sales]
        ${whereClause}
        ORDER BY bill_date DESC
        OFFSET ${offset} ROWS
        FETCH NEXT ${limit} ROWS ONLY
      `;

      const rows = await sequelize.query(dataQuery, {
        type: sequelize.QueryTypes.SELECT
      });

      res.json({
        sales: rows,
        currentPage: parseInt(page),
        totalPages,
        totalItems: totalItems,
        itemsPerPage: parseInt(limit)
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
    }
  },

  // Get order statistics (Admin - All Orders without customer filter)
  async getOrderStats(req, res) {
    try {
      const sequelize = Order.sequelize;
      
      // Get order statistics from  table (ALL orders - no customer filter)
      const [orderStats] = await sequelize.query(
        `SELECT
          COUNT(DISTINCT id) AS TotalOrders,
          SUM(qty) AS TotalQuantity,
          SUM(net_amount) AS TotalValue
        FROM [customerconnect].[dbo].[d2d_sales]`,
        {
          type: sequelize.QueryTypes.SELECT
        }
      );

      // Get dispatch count by matching d2d_sales.billing_doc_no with d2d_dispatch_entry.invoice_no
      const [dispatchStats] = await sequelize.query(
        `SELECT COUNT(DISTINCT s.billing_doc_no) as DispatchedCount
        FROM [customerconnect].[dbo].[d2d_sales] s
        INNER JOIN [customerconnect].[dbo].[d2d_dispatch_entry] d 
          ON s.billing_doc_no = d.invoice_no`,
        {
          type: sequelize.QueryTypes.SELECT
        }
      );

      // Get this month's orders
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);
      const currentMonthStr = currentMonth.toISOString().split('T')[0];

      const [thisMonthStats] = await sequelize.query(
        `SELECT
          COUNT(DISTINCT id) AS ThisMonthOrders,
          SUM(net_amount) AS ThisMonthAmount
        FROM [customerconnect].[dbo].[d2d_sales]
        WHERE bill_date >= :currentMonth`,
        {
          replacements: { currentMonth: currentMonthStr },
          type: sequelize.QueryTypes.SELECT
        }
      );

      const totalOrders = parseInt(orderStats.TotalOrders) || 0;
      const dispatchedCount = parseInt(dispatchStats.DispatchedCount) || 0;

      res.json({
        totalOrders: totalOrders,
        totalAmount: parseFloat(orderStats.TotalValue) || 0,
        totalQuantity: parseInt(orderStats.TotalQuantity) || 0,
        pendingOrders: totalOrders - dispatchedCount,
        completedOrders: dispatchedCount,
        dispatchedOrders: dispatchedCount,
        cancelledOrders: 0,
        thisMonthOrders: parseInt(thisMonthStats.ThisMonthOrders) || 0,
        thisMonthAmount: parseFloat(thisMonthStats.ThisMonthAmount) || 0
      });
    } catch (error) {
      console.error('Error fetching order stats:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  },

  // Get single order by ID
  async getOrderById(req, res) {
    try {
      const { id } = req.params;
      
      const order = await Order.findByPk(id);
      // Removed associations to avoid join issues

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json(order);
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  },

  // Create new order
  async createOrder(req, res) {
    try {
      const orderData = req.body;
      
      // Generate invoice number if not provided
      if (!orderData.invoice_number) {
        const year = new Date().getFullYear();
        const count = await Order.count({ where: { 
          invoice_number: { [Op.like]: `INV-${year}-%` } 
        }});
        orderData.invoice_number = `INV-${year}-${String(count + 1).padStart(3, '0')}`;
      }
      
      // Calculate amount if not provided
      if (!orderData.amount && orderData.quantity && orderData.unit_price) {
        orderData.amount = orderData.quantity * orderData.unit_price;
      }
      
      // Set created_by if user is authenticated
      if (req.user) {
        orderData.created_by = req.user.id;
      }

      const order = await Order.create(orderData);
      
      res.status(201).json(order);
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  },

  // Update order
  async updateOrder(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const order = await Order.findByPk(id);
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      // Recalculate amount if quantity or unit_price changed
      if ((updateData.quantity || updateData.unit_price) && !updateData.amount) {
        const quantity = updateData.quantity || order.quantity;
        const unitPrice = updateData.unit_price || order.unit_price;
        updateData.amount = quantity * unitPrice;
      }

      await order.update(updateData);
      
      res.json(order);
    } catch (error) {
      console.error('Error updating order:', error);
      res.status(500).json({ error: 'Failed to update order' });
    }
  },

  // Update order status
  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const order = await Order.findByPk(id);
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      await order.update({ status });
      
      res.json({ message: 'Order status updated successfully', order });
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  },

  // Delete order
  async deleteOrder(req, res) {
    try {
      const { id } = req.params;
      
      const order = await Order.findByPk(id);
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      await order.destroy();
      
      res.json({ message: 'Order deleted successfully' });
    } catch (error) {
      console.error('Error deleting order:', error);
      res.status(500).json({ error: 'Failed to delete order' });
    }
  },

  // Get orders by customer
  async getOrdersByCustomer(req, res) {
    try {
      const { customerName } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      const offset = (page - 1) * limit;
      
      const { count, rows } = await Order.findAndCountAll({
        where: { customer_name: { [Op.like]: `%${customerName}%` } },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['invoice_date', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        orders: rows,
        currentPage: parseInt(page),
        totalPages,
        totalItems: count
      });
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      res.status(500).json({ error: 'Failed to fetch customer orders' });
    }
  },

  // Get monthly sales chart data
  async getMonthlySalesChart(req, res) {
    try {
      const { period = 'last6months', customerCode } = req.query;
      const sequelize = Order.sequelize;

      // Determine how many months to fetch
      let monthsBack = 6;
      if (period === 'thisMonth') monthsBack = 1;
      else if (period === 'last3months') monthsBack = 3;
      else if (period === 'last6months') monthsBack = 6;
      else if (period === 'last12months') monthsBack = 12;

      // Build query with optional customer filter
      const customerFilter = customerCode ? `AND customer_code = '${customerCode}'` : '';

      const query = `
        WITH MonthRange AS (
          SELECT TOP (${monthsBack})
            DATEADD(MONTH, -ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) + 1, 
                    DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1)) AS MonthStart
          FROM sys.all_objects
        ),
        MonthlySales AS (
          SELECT 
            YEAR(CAST(bill_date AS DATE)) AS Year,
            MONTH(CAST(bill_date AS DATE)) AS Month,
            SUM(CAST(ISNULL(net_amount, 0) AS FLOAT)) AS TotalValue,
            SUM(CAST(ISNULL(qty, 0) AS FLOAT)) AS TotalQuantity
          FROM [customerconnect].[dbo].[d2d_sales]
          WHERE bill_date IS NOT NULL
            AND CAST(bill_date AS DATE) >= DATEADD(MONTH, -${monthsBack}, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
            ${customerFilter}
          GROUP BY YEAR(CAST(bill_date AS DATE)), MONTH(CAST(bill_date AS DATE))
        )
        SELECT 
          FORMAT(mr.MonthStart, 'MMM yyyy') AS month,
          CAST(ISNULL(ms.TotalValue, 0) AS FLOAT) AS value,
          CAST(ISNULL(ms.TotalQuantity, 0) AS FLOAT) AS quantity
        FROM MonthRange mr
        LEFT JOIN MonthlySales ms 
          ON YEAR(mr.MonthStart) = ms.Year AND MONTH(mr.MonthStart) = ms.Month
        ORDER BY mr.MonthStart ASC
      `;

      const chartData = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT
      });

      res.json({
        success: true,
        data: chartData
      });
    } catch (error) {
      console.error('Error fetching monthly sales chart:', error);
      console.error('Error message:', error.message);
      console.error('SQL Query:', error.sql || 'N/A');
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch sales chart data',
        details: error.message
      });
    }
  }
};

module.exports = orderController;
