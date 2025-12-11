const { InvoiceToDelivery, sequelize } = require('../models');
const { Op } = require('sequelize');

const invoiceToDeliveryController = {
  // Get all invoice to delivery records with pagination and search (JOIN query)
  async getInvoiceToDeliveries(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        status = ''
      } = req.query;

      const offset = (page - 1) * limit;
      
      // Build WHERE conditions for search and filters
      let whereConditions = [];
      
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
      
      const whereClause = whereConditions.length > 0 
        ? 'WHERE ' + whereConditions.join(' AND ') 
        : '';

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
          FROM [D2D].[dbo].[d2d_dispatch_entry] a 
          INNER JOIN [D2D].[dbo].[d2d_sales] b
            ON a.invoice_no = b.billing_doc_no
          ${whereClause}
          GROUP BY b.customer_code, a.invoice_no, b.bill_date, a.waybill_no, a.trackingstatus
        ) as CountTable
      `;
      
      const [countResult] = await sequelize.query(countQuery, {
        type: sequelize.QueryTypes.SELECT
      });
      
      const totalItems = countResult.total;
      const totalPages = Math.ceil(totalItems / limit);

      // Get paginated data
      const dataQuery = `
        SELECT DISTINCT  
          b.customer_code,
          a.invoice_no,
          b.bill_date as InvoiceDate,
          SUM(b.basis_rate_inr) as Value,
          a.waybill_no as LRNumber,
          a.trackingstatus as Status
        FROM [D2D].[dbo].[d2d_dispatch_entry] a 
        INNER JOIN [D2D].[dbo].[d2d_sales] b
          ON a.invoice_no = b.billing_doc_no
        ${whereClause}
        GROUP BY b.customer_code, a.invoice_no, b.bill_date, a.waybill_no, a.trackingstatus
        ORDER BY b.bill_date DESC
        OFFSET ${offset} ROWS
        FETCH NEXT ${limit} ROWS ONLY
      `;

      const rows = await sequelize.query(dataQuery, {
        type: sequelize.QueryTypes.SELECT
      });

      res.json({
        invoices: rows,
        currentPage: parseInt(page),
        totalPages,
        totalItems: totalItems,
        itemsPerPage: parseInt(limit)
      });
    } catch (error) {
      console.error('Error fetching invoice to deliveries:', error);
      res.status(500).json({ 
        error: 'Failed to fetch invoice to deliveries',
        details: error.message 
      });
    }
  },

  // Get single invoice to delivery by ID
  async getInvoiceToDeliveryById(req, res) {
    try {
      const { id } = req.params;
      
      const invoice = await InvoiceToDelivery.findByPk(id);

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice to delivery record not found' });
      }

      res.json(invoice);
    } catch (error) {
      console.error('Error fetching invoice to delivery:', error);
      res.status(500).json({ error: 'Failed to fetch invoice to delivery' });
    }
  },

  // Get statistics
  async getInvoiceToDeliveryStats(req, res) {
    try {
      const totalRecords = await InvoiceToDelivery.count();
      
      const pendingCount = await InvoiceToDelivery.count({
        where: { status: 'pending' }
      });
      
      const dispatchedCount = await InvoiceToDelivery.count({
        where: { status: 'dispatched' }
      });
      
      const deliveredCount = await InvoiceToDelivery.count({
        where: { status: 'delivered' }
      });

      res.json({
        totalRecords,
        pendingCount,
        dispatchedCount,
        deliveredCount
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  },

  // Create new invoice to delivery record
  async createInvoiceToDelivery(req, res) {
    try {
      const invoiceData = req.body;
      
      const invoice = await InvoiceToDelivery.create(invoiceData);
      
      res.status(201).json(invoice);
    } catch (error) {
      console.error('Error creating invoice to delivery:', error);
      res.status(500).json({ error: 'Failed to create invoice to delivery' });
    }
  },

  // Update invoice to delivery
  async updateInvoiceToDelivery(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const invoice = await InvoiceToDelivery.findByPk(id);
      
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice to delivery record not found' });
      }

      await invoice.update(updateData);
      
      res.json(invoice);
    } catch (error) {
      console.error('Error updating invoice to delivery:', error);
      res.status(500).json({ error: 'Failed to update invoice to delivery' });
    }
  },

  // Delete invoice to delivery
  async deleteInvoiceToDelivery(req, res) {
    try {
      const { id } = req.params;
      
      const invoice = await InvoiceToDelivery.findByPk(id);
      
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice to delivery record not found' });
      }
      
      await invoice.destroy();
      
      res.json({ message: 'Invoice to delivery record deleted successfully' });
    } catch (error) {
      console.error('Error deleting invoice to delivery:', error);
      res.status(500).json({ error: 'Failed to delete invoice to delivery' });
    }
  }
};

module.exports = invoiceToDeliveryController;