'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if the column already exists
    const tableInfo = await queryInterface.describeTable('tbl_meeting_minutes');
    
    if (!tableInfo.mom_number) {
      await queryInterface.addColumn('tbl_meeting_minutes', 'mom_number', {
        type: Sequelize.STRING(50),
        allowNull: true, // Initially allow null to handle existing records
        unique: true
      });
      
      // Update existing records with a generated MOM number
      await queryInterface.sequelize.query(`
        UPDATE tbl_meeting_minutes 
        SET mom_number = CONCAT('MOM-', YEAR(meeting_date), '-', FORMAT(id, '000'))
        WHERE mom_number IS NULL
      `);
      
      // Now make the column NOT NULL
      await queryInterface.changeColumn('tbl_meeting_minutes', 'mom_number', {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('tbl_meeting_minutes');
    
    if (tableInfo.mom_number) {
      await queryInterface.removeColumn('tbl_meeting_minutes', 'mom_number');
    }
  }
};
