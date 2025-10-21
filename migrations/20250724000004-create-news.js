'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tbl_news', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      news_number: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      news_name: {
        type: Sequelize.STRING(250),
        allowNull: false
      },
      news_title: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      news_long_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      news_short_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      news_image1: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      news_image2: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      document: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
      },
      priority: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      created_date: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      created_by: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      modified_date: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      modified_by: {
        type: Sequelize.STRING(100),
        allowNull: true
      }
    });

    // Add indexes
    await queryInterface.addIndex('tbl_news', ['news_number'], {
      unique: true,
      name: 'idx_news_number'
    });
    
    await queryInterface.addIndex('tbl_news', ['status'], {
      name: 'idx_news_status'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tbl_news');
  }
};