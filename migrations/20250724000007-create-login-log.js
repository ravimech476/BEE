'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tbl_login_log', {
      sl_no: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      login_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tbl_users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      login_datetime: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      logout_datetime: {
        type: Sequelize.DATE,
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      }
    });

    // Add indexes
    await queryInterface.addIndex('tbl_login_log', ['login_id'], {
      name: 'idx_login_log_user_id'
    });
    
    await queryInterface.addIndex('tbl_login_log', ['login_datetime'], {
      name: 'idx_login_log_datetime'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tbl_login_log');
  }
};