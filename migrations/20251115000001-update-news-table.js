'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if 'company_news' table already exists
    const tables = await queryInterface.showAllTables();
    
    if (tables.includes('company_news')) {
      console.log('Company_news table already exists, skipping creation');
      return;
    }
    
    // Check if old tbl_news exists
    if (tables.includes('tbl_news')) {
      console.log('Renaming tbl_news to company_news and updating structure...');
      
      // Rename table
      await queryInterface.renameTable('tbl_news', 'company_news');
      
      // Drop old columns
      await queryInterface.removeColumn('company_news', 'news_number');
      await queryInterface.removeColumn('company_news', 'news_name');
      await queryInterface.removeColumn('company_news', 'news_title');
      await queryInterface.removeColumn('company_news', 'news_long_description');
      await queryInterface.removeColumn('company_news', 'news_short_description');
      await queryInterface.removeColumn('company_news', 'news_image1');
      await queryInterface.removeColumn('company_news', 'news_image2');
      await queryInterface.removeColumn('company_news', 'document');
      await queryInterface.removeColumn('company_news', 'priority');
      
      // Add new columns
      await queryInterface.addColumn('company_news', 'title', {
        type: Sequelize.STRING(500),
        allowNull: false,
        defaultValue: 'Untitled'
      });
      
      await queryInterface.addColumn('company_news', 'content', {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: 'No content'
      });
      
      await queryInterface.addColumn('company_news', 'excerpt', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      
      await queryInterface.addColumn('company_news', 'image', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
      
      await queryInterface.addColumn('company_news', 'category', {
        type: Sequelize.STRING(100),
        allowNull: true
      });
      
      await queryInterface.addColumn('company_news', 'display_order', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      });
      
      await queryInterface.addColumn('company_news', 'published_date', {
        type: Sequelize.DATE,
        allowNull: true
      });
      
      // Update status column to allow draft
      await queryInterface.changeColumn('company_news', 'status', {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'active'
      });
      
      // Update created_by and modified_by to integers
      await queryInterface.changeColumn('company_news', 'created_by', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
      
      await queryInterface.changeColumn('company_news', 'modified_by', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
      
      await queryInterface.changeColumn('company_news', 'modified_date', {
        type: Sequelize.DATE,
        allowNull: true
      });
      
    } else if (tables.includes('news')) {
      // If 'news' table exists, rename to 'company_news'
      console.log('Renaming news to company_news...');
      await queryInterface.renameTable('news', 'company_news');
      
    } else {
      // Create fresh company_news table
      console.log('Creating fresh company_news table...');
      
      await queryInterface.createTable('company_news', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        title: {
          type: Sequelize.STRING(500),
          allowNull: false
        },
        content: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        excerpt: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        image: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        category: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        display_order: {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: 0
        },
        status: {
          type: Sequelize.STRING(20),
          allowNull: false,
          defaultValue: 'active'
        },
        published_date: {
          type: Sequelize.DATE,
          allowNull: true
        },
        created_date: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        modified_date: {
          type: Sequelize.DATE,
          allowNull: true
        },
        created_by: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        modified_by: {
          type: Sequelize.INTEGER,
          allowNull: true
        }
      });
      
      // Add indexes
      await queryInterface.addIndex('company_news', ['status'], {
        name: 'idx_company_news_status'
      });
      
      await queryInterface.addIndex('company_news', ['published_date'], {
        name: 'idx_company_news_published_date'
      });
      
      await queryInterface.addIndex('company_news', ['category'], {
        name: 'idx_company_news_category'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('company_news');
  }
};
