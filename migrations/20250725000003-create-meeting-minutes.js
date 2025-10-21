'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tbl_meeting_minutes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      meeting_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      attendees: {
        type: Sequelize.TEXT, // Changed from JSON to TEXT for SQL Server compatibility
        allowNull: true,
        defaultValue: JSON.stringify([])
      },
      agenda: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      minutes: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      action_items: {
        type: Sequelize.TEXT, // Changed from JSON to TEXT for SQL Server compatibility
        allowNull: true,
        defaultValue: JSON.stringify([])
      },
      next_meeting_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('draft', 'finalized', 'archived'),
        allowNull: false,
        defaultValue: 'draft'
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
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
    await queryInterface.addIndex('tbl_meeting_minutes', ['meeting_date']);
    await queryInterface.addIndex('tbl_meeting_minutes', ['status']);
    await queryInterface.addIndex('tbl_meeting_minutes', ['created_by']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tbl_meeting_minutes');
  }
};