'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tbl_users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      username: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      email_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      role: {
        type: Sequelize.ENUM('admin', 'customer'),
        allowNull: false,
        defaultValue: 'customer'
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
      },
      last_login_datetime: {
        type: Sequelize.DATE,
        allowNull: true
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
    await queryInterface.addIndex('tbl_users', ['username'], {
      unique: true,
      name: 'idx_users_username'
    });
    
    await queryInterface.addIndex('tbl_users', ['email_id'], {
      unique: true,
      name: 'idx_users_email'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tbl_users');
  }
};