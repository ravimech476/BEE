'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create expert_settings table
    await queryInterface.createTable('expert_settings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('GETDATE()')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('GETDATE()')
      }
    });

    // Create social_media_links table
    await queryInterface.createTable('social_media_links', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      icon: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      link: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      sortOrder: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('GETDATE()')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('GETDATE()')
      }
    });

    // Add indexes
    await queryInterface.addIndex('expert_settings', ['isActive'], {
      name: 'idx_expert_settings_active'
    });

    await queryInterface.addIndex('social_media_links', ['isActive', 'sortOrder'], {
      name: 'idx_social_media_active_sort'
    });

    // Insert default expert settings if none exist
    await queryInterface.bulkInsert('expert_settings', [{
      email: 'expert@customerconnect.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);

    // Insert some default social media links
    await queryInterface.bulkInsert('social_media_links', [
      {
        name: 'Facebook',
        icon: '📘',
        link: 'https://facebook.com/customerconnect',
        isActive: true,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Twitter',
        icon: '🐦',
        link: 'https://twitter.com/customerconnect',
        isActive: true,
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'LinkedIn',
        icon: '💼',
        link: 'https://linkedin.com/company/customerconnect',
        isActive: true,
        sortOrder: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('social_media_links');
    await queryInterface.dropTable('expert_settings');
  }
};