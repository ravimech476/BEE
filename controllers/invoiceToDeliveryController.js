const { InvoiceToDelivery } = require('../models');
const { Op } = require('sequelize');

const invoiceToDeliveryController = {
  // Get all invoice to delivery records with pagination and search
  async getInvoiceToDeliveries(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        status = ''
      } = req.query;

      const offset = (page - 1) * limit;
      
      // Build where clause
      const whereClause = {};
      
      if (search) {
        whereClause[Op.or] = [
          { invoice_number: { [Op.like]: `%${search}%` } },
          { lr_number: { [Op.like]: `%${search}%` } },
          { delivery_partner: { [Op.like]: `%${search}%` } }
        ];
      }
      
      if (status) {
        whereClause.status = status;
      }

      const { count, rows } = await InvoiceToDelivery.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['sl_no', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        invoices: rows,
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit)
      });
    } catch (error) {
      console.error('Error fetching invoice to deliveries:', error);
      res.status(500).json({ error: 'Failed to fetch invoice to deliveries' });
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