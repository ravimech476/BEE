'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tbl_statement', {
      sl_no: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      customer_code: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      customer_name: {
        type: Sequelize.STRING(250),
        allowNull: false
      },
      customer_group: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      outstanding_value: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
        defaultValue: 0.00
      },
      invoice_number: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      invoice_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      total_paid_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
        defaultValue: 0.00
      },
      status: {
        type: Sequelize.ENUM('pending', 'partial', 'paid'),
        allowNull: false,
        defaultValue: 'pending'
      },
      created_date: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      modified_date: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('tbl_statement', ['customer_code'], {
      name: 'idx_statement_customer_code'
    });
    
    await queryInterface.addIndex('tbl_statement', ['invoice_number'], {
      name: 'idx_statement_invoice_number'
    });
    
    await queryInterface.addIndex('tbl_statement', ['status'], {
      name: 'idx_statement_status'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tbl_statement');
  }
};