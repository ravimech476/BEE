'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // SQL Server doesn't support ENUM modification easily, so we'll handle this in the application layer
      // The existing role column will continue to work with admin/customer
      // Additional roles (manager, user) can be handled by the role_id foreign key
      console.log('✓ Role enum update skipped for SQL Server compatibility');
    } catch (error) {
      console.error('Error updating roles enum:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // No changes to revert
  }
};