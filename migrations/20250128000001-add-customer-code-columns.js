'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Add customer_code to orders table
      await queryInterface.addColumn('orders', 'customer_code', {
        type: Sequelize.STRING(50),
        allowNull: true
      }, { transaction });

      // Add customer_code to tbl_meeting_minutes table
      await queryInterface.addColumn('tbl_meeting_minutes', 'customer_code', {
        type: Sequelize.STRING(50),
        allowNull: true
      }, { transaction });

      // Add customer_code to tbl_market_research table
      await queryInterface.addColumn('tbl_market_research', 'customer_code', {
        type: Sequelize.STRING(50),
        allowNull: true
      }, { transaction });

      // Add customer_code to tbl_invoice_to_delivery table
      await queryInterface.addColumn('tbl_invoice_to_delivery', 'customer_code', {
        type: Sequelize.STRING(50),
        allowNull: true
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      await queryInterface.removeColumn('orders', 'customer_code', { transaction });
      await queryInterface.removeColumn('tbl_meeting_minutes', 'customer_code', { transaction });
      await queryInterface.removeColumn('tbl_market_research', 'customer_code', { transaction });
      await queryInterface.removeColumn('tbl_invoice_to_delivery', 'customer_code', { transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
