const { Statement } = require('../models');
const { Op } = require('sequelize');

const paymentController = {
  // Get all payment statements with pagination and filtering
  getAllPayments: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '', dateFrom = '', dateTo = '' } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      
      if (search) {
        where[Op.or] = [
          { customer_name: { [Op.like]: `%${search}%` } },
          { invoice_number: { [Op.like]: `%${search}%` } },
          { customer_code: { [Op.like]: `%${search}%` } }
        ];
      }

      if (dateFrom || dateTo) {
        where.invoice_date = {};
        if (dateFrom) where.invoice_date[Op.gte] = new Date(dateFrom);
        if (dateTo) where.invoice_date[Op.lte] = new Date(dateTo);
      }

      const { count, rows: payments } = await Statement.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['invoice_date', 'DESC']]
      });

      // Transform data to match expected format
      const transformedPayments = payments.map(payment => ({
        id: payment.sl_no,
        customer_name: payment.customer_name,
        invoice_number: payment.invoice_number,
        amount: payment.total_paid_amount || payment.outstanding_value || 0,
        date: payment.invoice_date,
        payment_method: 'N/A', // Not available in current schema
        reference_number: payment.customer_code,
        status: payment.status,
        notes: payment.customer_group || '',
        due_date: payment.due_date,
        outstanding_value: payment.outstanding_value
      }));

      res.json({
        payments: transformedPayments,
        totalCount: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page)
      });
    } catch (error) {
      console.error('Error fetching payment statements:', error);
      res.status(500).json({ error: 'Failed to fetch payment statements' });
    }
  },

  // Get payment by ID
  getPaymentById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const payment = await Statement.findByPk(id);

      if (!payment) {
        return res.status(404).json({ error: 'Payment statement not found' });
      }

      // Transform data to match expected format
      const transformedPayment = {
        id: payment.sl_no,
        customer_name: payment.customer_name,
        invoice_number: payment.invoice_number,
        amount: payment.total_paid_amount || payment.outstanding_value || 0,
        date: payment.invoice_date,
        payment_method: 'N/A', // Not available in current schema
        reference_number: payment.customer_code,
        status: payment.status,
        notes: payment.customer_group || '',
        due_date: payment.due_date,
        outstanding_value: payment.outstanding_value
      };

      res.json(transformedPayment);
    } catch (error) {
      console.error('Error fetching payment statement:', error);
      res.status(500).json({ error: 'Failed to fetch payment statement' });
    }
  },

  // Create new payment statement
  createPayment: async (req, res) => {
    try {
      const {
        customer_name,
        customer_code,
        customer_group,
        invoice_number,
        invoice_date,
        due_date,
        total_paid_amount,
        outstanding_value,
        status = 'pending'
      } = req.body;

      const newPayment = await Statement.create({
        customer_name,
        customer_code: customer_code || 'CUST001',
        customer_group,
        invoice_number,
        invoice_date: new Date(invoice_date),
        due_date: due_date ? new Date(due_date) : null,
        total_paid_amount: parseFloat(total_paid_amount) || 0,
        outstanding_value: parseFloat(outstanding_value) || 0,
        status
      });

      res.status(201).json(newPayment);
    } catch (error) {
      console.error('Error creating payment statement:', error);
      res.status(500).json({ error: 'Failed to create payment statement' });
    }
  },

  // Update payment statement
  updatePayment: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      // Convert date fields if provided
      if (updateData.invoice_date) {
        updateData.invoice_date = new Date(updateData.invoice_date);
      }
      if (updateData.due_date) {
        updateData.due_date = new Date(updateData.due_date);
      }

      // Convert numeric fields if provided
      if (updateData.total_paid_amount) {
        updateData.total_paid_amount = parseFloat(updateData.total_paid_amount);
      }
      if (updateData.outstanding_value) {
        updateData.outstanding_value = parseFloat(updateData.outstanding_value);
      }

      const [updatedRows] = await Statement.update(updateData, {
        where: { sl_no: id }
      });

      if (updatedRows === 0) {
        return res.status(404).json({ error: 'Payment statement not found' });
      }

      const updatedPayment = await Statement.findByPk(id);

      res.json(updatedPayment);
    } catch (error) {
      console.error('Error updating payment statement:', error);
      res.status(500).json({ error: 'Failed to update payment statement' });
    }
  },

  // Delete payment statement
  deletePayment: async (req, res) => {
    try {
      const { id } = req.params;

      const deletedRows = await Statement.destroy({
        where: { sl_no: id }
      });

      if (deletedRows === 0) {
        return res.status(404).json({ error: 'Payment statement not found' });
      }

      res.json({ message: 'Payment statement deleted successfully' });
    } catch (error) {
      console.error('Error deleting payment statement:', error);
      res.status(500).json({ error: 'Failed to delete payment statement' });
    }
  },

  // Get payment statistics
  getPaymentStats: async (req, res) => {
    try {
      const totalPayments = await Statement.count();
      
      // Calculate total amount using correct column
      const totalAmountResult = await Statement.sum('total_paid_amount');
      const totalAmount = totalAmountResult || 0;

      // Calculate outstanding amount
      const outstandingAmountResult = await Statement.sum('outstanding_value');
      const totalOutstanding = outstandingAmountResult || 0;

      // Get this month's payments
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const thisMonthPayments = await Statement.count({
        where: {
          invoice_date: {
            [Op.gte]: currentMonth
          }
        }
      });

      const thisMonthAmount = await Statement.sum('total_paid_amount', {
        where: {
          invoice_date: {
            [Op.gte]: currentMonth
          }
        }
      }) || 0;

      // Count by status
      const pendingPayments = await Statement.count({ where: { status: 'pending' } });
      const paidPayments = await Statement.count({ where: { status: 'paid' } });
      const partialPayments = await Statement.count({ where: { status: 'partial' } });

      res.json({
        totalPayments,
        totalAmount,
        totalOutstanding,
        thisMonthPayments,
        thisMonthAmount,
        pendingPayments,
        paidPayments,
        partialPayments
      });
    } catch (error) {
      console.error('Error fetching payment statistics:', error);
      res.status(500).json({ error: 'Failed to fetch payment statistics' });
    }
  }
};

module.exports = paymentController;