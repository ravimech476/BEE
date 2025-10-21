'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if the column already exists
    const tableInfo = await queryInterface.describeTable('tbl_meeting_minutes');
    
    if (!tableInfo.attachments) {
      await queryInterface.addColumn('tbl_meeting_minutes', 'attachments', {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: JSON.stringify([])
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('tbl_meeting_minutes');
    
    if (tableInfo.attachments) {
      await queryInterface.removeColumn('tbl_meeting_minutes', 'attachments');
    }
  }
};
