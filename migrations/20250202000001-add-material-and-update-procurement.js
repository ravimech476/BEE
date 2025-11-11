'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add material column
    await queryInterface.addColumn('tbl_products', 'material', {
      type: Sequelize.STRING(200),
      allowNull: true,
      comment: 'Material information'
    });

    // Change procurement_method from VARCHAR(100) to TEXT
    await queryInterface.changeColumn('tbl_products', 'procurement_method', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Procurement methods as JSON array'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove material column
    await queryInterface.removeColumn('tbl_products', 'material');

    // Revert procurement_method back to VARCHAR(100)
    await queryInterface.changeColumn('tbl_products', 'procurement_method', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Procurement method'
    });
  }
};
