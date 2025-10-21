'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tbl_roles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      role_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      permissions: {
        type: Sequelize.TEXT, // Changed from JSON to TEXT for SQL Server compatibility
        allowNull: false,
        defaultValue: JSON.stringify({
          dashboard: false,
          users: false,
          roles: false,
          products: false,
          orders: false,
          meetings: false,
          market_reports: false,
          payments: false
        })
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'tbl_users',
          key: 'id'
        }
      },
      created_date: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('GETDATE()')
      },
      modified_date: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('GETDATE()')
      }
    });

    // Add indexes
    await queryInterface.addIndex('tbl_roles', ['role_name']);
    await queryInterface.addIndex('tbl_roles', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tbl_roles');
  }
};