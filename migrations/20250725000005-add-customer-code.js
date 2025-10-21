'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if customer_code column already exists
      const [columns] = await queryInterface.sequelize.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'tbl_users' AND COLUMN_NAME = 'customer_code'
      `);

      if (columns.length === 0) {
        await queryInterface.addColumn('tbl_users', 'customer_code', {
          type: Sequelize.STRING(50),
          allowNull: true,
          unique: true
        });

        // Add index for customer_code
        await queryInterface.addIndex('tbl_users', ['customer_code']);
        
        console.log('✅ customer_code column added to tbl_users');
      } else {
        console.log('✅ customer_code column already exists');
      }
    } catch (error) {
      console.error('Error adding customer_code column:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('tbl_users', 'customer_code');
  }
};