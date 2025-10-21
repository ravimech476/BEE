'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tbl_market_research', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      research_number: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      research_name: {
        type: Sequelize.STRING(250),
        allowNull: false
      },
      research_title: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      research_long_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      video_link: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      research_short_description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      research_image1: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      research_image2: {
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
    await queryInterface.addIndex('tbl_market_research', ['research_number'], {
      unique: true,
      name: 'idx_research_number'
    });
    
    await queryInterface.addIndex('tbl_market_research', ['status'], {
      name: 'idx_research_status'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tbl_market_research');
  }
};