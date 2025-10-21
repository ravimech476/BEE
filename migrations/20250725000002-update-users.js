'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Add new columns to tbl_users table
      await queryInterface.addColumn('tbl_users', 'first_name', {
        type: Sequelize.STRING(100),
        allowNull: true
      });

      await queryInterface.addColumn('tbl_users', 'last_name', {
        type: Sequelize.STRING(100),
        allowNull: true
      });

      await queryInterface.addColumn('tbl_users', 'phone', {
        type: Sequelize.STRING(20),
        allowNull: true
      });

      await queryInterface.addColumn('tbl_users', 'role_id', {
        type: Sequelize.INTEGER,
        allowNull: true
      });

      await queryInterface.addColumn('tbl_users', 'created_by', {
        type: Sequelize.INTEGER,
        allowNull: true
      });

      // Add indexes
      await queryInterface.addIndex('tbl_users', ['role_id']);
      await queryInterface.addIndex('tbl_users', ['created_by']);

      console.log('✓ Successfully updated tbl_users table');
    } catch (error) {
      console.error('Error updating tbl_users:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove added columns
    await queryInterface.removeColumn('tbl_users', 'first_name');
    await queryInterface.removeColumn('tbl_users', 'last_name');
    await queryInterface.removeColumn('tbl_users', 'phone');
    await queryInterface.removeColumn('tbl_users', 'role_id');
    await queryInterface.removeColumn('tbl_users', 'created_by');
  }
};