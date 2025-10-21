'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tbl_products', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      product_number: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      product_name: {
        type: Sequelize.STRING(250),
        allowNull: false
      },
      product_long_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      uom: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      product_short_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      product_image1: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      product_image2: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      product_group: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
      },
      priority: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
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
    await queryInterface.addIndex('tbl_products', ['product_number'], {
      unique: true,
      name: 'idx_products_number'
    });
    
    await queryInterface.addIndex('tbl_products', ['status'], {
      name: 'idx_products_status'
    });
    
    await queryInterface.addIndex('tbl_products', ['priority'], {
      name: 'idx_products_priority'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tbl_products');
  }
};