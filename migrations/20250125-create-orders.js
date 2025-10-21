'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      invoice_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      customer_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      customer_email: {
        type: Sequelize.STRING,
        allowNull: true
      },
      customer_phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      product_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'products',
          key: 'id'
        }
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      unit_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      invoice_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      delivery_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pending'
      },
      payment_status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pending'
      },
      shipping_address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('orders', ['invoice_number']);
    await queryInterface.addIndex('orders', ['customer_name']);
    await queryInterface.addIndex('orders', ['status']);
    await queryInterface.addIndex('orders', ['invoice_date']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('orders');
  }
};