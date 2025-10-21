'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tbl_invoice_to_delivery', {
      sl_no: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      invoice_number: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      invoice_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      invoice_value: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      invoice_value_inr: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      dispatch_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      lr_number: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      delivery_partner: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      delivered_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'dispatched', 'delivered'),
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
    await queryInterface.addIndex('tbl_invoice_to_delivery', ['invoice_number'], {
      name: 'idx_invoice_number'
    });
    
    await queryInterface.addIndex('tbl_invoice_to_delivery', ['status'], {
      name: 'idx_invoice_status'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tbl_invoice_to_delivery');
  }
};