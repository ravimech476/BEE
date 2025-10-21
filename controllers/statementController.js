const { Statement } = require('../models');
const { Op, Sequelize } = require('sequelize');
const sequelize = require('../config/database');

const statementController = {
  // Get all statements (with filtering and pagination)
  getAllStatements: async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        customer_code,
        sortBy = 'invoice_date',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Add search condition
      if (search) {
        whereClause[Op.or] = [
          { customer_name: { [Op.like]: `%${search}%` } },
          { customer_code: { [Op.like]: `%${search}%` } },
          { invoice_number: { [Op.like]: `%${search}%` } }
        ];
      }

      // Add status filter
      if (status) {
        whereClause.status = status;
      }

      // Add customer filter
      if (customer_code) {
        whereClause.customer_code = customer_code;
      }

      const { count, rows } = await Statement.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, sortOrder.toUpperCase()]]
      });

      res.json({
        success: true,
        statements: rows,
        pagination: {
          total: count,
          totalPages: Math.ceil(count / limit),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single statement by ID
  getStatementById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const statement = await Statement.findByPk(id);

      if (!statement) {
        return res.status(404).json({
          success: false,
          message: 'Statement not found'
        });
      }

      res.json({
        success: true,
        statement
      });
    } catch (error) {
      next(error);
    }
  },

  // Get statements for a specific customer
  getStatementsByCustomer: async (req, res, next) => {
    try {
      const { customerCode } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const offset = (page - 1) * limit;

      const { count, rows } = await Statement.findAndCountAll({
        where: { customer_code: customerCode },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['invoice_date', 'DESC']]
      });

      res.json({
        success: true,
        statements: rows,
        pagination: {
          total: count,
          totalPages: Math.ceil(count / limit),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get statement summary
  getStatementSummary: async (req, res, next) => {
    try {
      const summary = await Statement.findAll({
        attributes: [
          [Sequelize.fn('COUNT', Sequelize.col('sl_no')), 'total_statements'],
          [Sequelize.fn('SUM', Sequelize.col('outstanding_value')), 'total_outstanding'],
          [Sequelize.fn('SUM', Sequelize.col('total_paid_amount')), 'total_paid'],
          'status'
        ],
        group: ['status']
      });

      const overallSummary = await Statement.findOne({
        attributes: [
          [Sequelize.fn('COUNT', Sequelize.col('sl_no')), 'total_statements'],
          [Sequelize.fn('SUM', Sequelize.col('outstanding_value')), 'total_outstanding'],
          [Sequelize.fn('SUM', Sequelize.col('total_paid_amount')), 'total_paid']
        ]
      });

      res.json({
        success: true,
        summary,
        overall: overallSummary
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = statementController;
