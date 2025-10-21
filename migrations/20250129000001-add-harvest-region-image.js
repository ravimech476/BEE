'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('tbl_products', 'harvest_region_image', {
      type: Sequelize.STRING(200),
      allowNull: true,
      comment: 'Harvest region image path',
      after: 'harvest_region_new'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('tbl_products', 'harvest_region_image');
  }
};
