const { InvoiceToDelivery } = require('../models');
const { Op, sequelize } = require('sequelize');
const db = require('../models');

const invoiceController = {
  // Get all invoices (with filtering and pagination)
  getAllInvoices: async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        sortBy = 'invoice_date',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Add search condition
      if (search) {
        whereClause[Op.or] = [
          { invoice_number: { [Op.like]: `%${search}%` } },
          { lr_number: { [Op.like]: `%${search}%` } },
          { delivery_partner: { [Op.like]: `%${search}%` } }
        ];
      }

      // Add status filter
      if (status) {
        whereClause.status = status;
      }

      const { count, rows } = await InvoiceToDelivery.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, sortOrder.toUpperCase()]]
      });

      res.json({
        success: true,
        data: {
          invoices: rows,
          pagination: {
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single invoice
  getInvoiceById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const invoice = await InvoiceToDelivery.findByPk(id);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      res.json({
        success: true,
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new invoice (Admin only)
  createInvoice: async (req, res, next) => {
    try {
      const {
        invoice_number,
        invoice_date,
        invoice_value,
        invoice_value_inr,
        dispatch_date,
        lr_number,
        delivery_partner,
        delivered_date,
        status = 'pending'
      } = req.body;

      const invoice = await InvoiceToDelivery.create({
        invoice_number,
        invoice_date,
        invoice_value,
        invoice_value_inr,
        dispatch_date,
        lr_number,
        delivery_partner,
        delivered_date,
        status,
        created_date: new Date(),
        modified_date: new Date()
      });

      res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  },

  // Update invoice (Admin only)
  updateInvoice: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body, modified_date: new Date() };

      const invoice = await InvoiceToDelivery.findByPk(id);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      await invoice.update(updateData);

      const updatedInvoice = await InvoiceToDelivery.findByPk(id);

      res.json({
        success: true,
        message: 'Invoice updated successfully',
        data: updatedInvoice
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete invoice (Admin only)
  deleteInvoice: async (req, res, next) => {
    try {
      const { id } = req.params;

      const invoice = await InvoiceToDelivery.findByPk(id);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      await invoice.destroy();

      res.json({
        success: true,
        message: 'Invoice deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Get invoice statistics
  getInvoiceStats: async (req, res, next) => {
    try {
      const stats = await InvoiceToDelivery.findAll({
        attributes: [
          'status',
          [db.sequelize.fn('COUNT', db.sequelize.col('sl_no')), 'count']
        ],
        group: ['status']
      });

      const totalInvoices = await InvoiceToDelivery.count();

      res.json({
        success: true,
        data: {
          total: totalInvoices,
          byStatus: stats.reduce((acc, stat) => {
            acc[stat.status] = parseInt(stat.dataValues.count);
            return acc;
          }, {})
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update delivery status (Admin only)
  updateDeliveryStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, delivered_date } = req.body;

      if (!['pending', 'dispatched', 'delivered'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value'
        });
      }

      const invoice = await InvoiceToDelivery.findByPk(id);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found'
        });
      }

      const updateData = {
        status,
        modified_date: new Date()
      };

      if (status === 'delivered' && delivered_date) {
        updateData.delivered_date = delivered_date;
      }

      await invoice.update(updateData);

      const updatedInvoice = await InvoiceToDelivery.findByPk(id);

      res.json({
        success: true,
        message: 'Delivery status updated successfully',
        data: updatedInvoice
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = invoiceController;