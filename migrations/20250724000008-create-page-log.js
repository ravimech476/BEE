'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tbl_page_log', {
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
      page_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      datetime: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      session_id: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      action: {
        type: Sequelize.STRING(50),
        allowNull: true
      }
    });

    // Add indexes
    await queryInterface.addIndex('tbl_page_log', ['login_id'], {
      name: 'idx_page_log_user_id'
    });
    
    await queryInterface.addIndex('tbl_page_log', ['page_name'], {
      name: 'idx_page_log_page_name'
    });
    
    await queryInterface.addIndex('tbl_page_log', ['datetime'], {
      name: 'idx_page_log_datetime'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tbl_page_log');
  }
};