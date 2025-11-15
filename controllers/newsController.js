const { News } = require('../models');
const { Op } = require('sequelize');

const newsController = {
  // Get all news (with filtering and pagination)
  getAllNews: async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        sortBy = 'priority',
        sortOrder = 'ASC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Add search condition
      if (search) {
        whereClause[Op.or] = [
          { news_name: { [Op.like]: `%${search}%` } },
          { news_title: { [Op.like]: `%${search}%` } },
          { news_short_description: { [Op.like]: `%${search}%` } }
        ];
      }

      // Add status filter
      if (status) {
        whereClause.status = status;
      }

      // For customers, only show active news
      if (req.user.role === 'customer') {
        whereClause.status = 'active';
      }

      const { count, rows } = await News.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, sortOrder.toUpperCase()], ['created_date', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          news: rows,
          pagination: {
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single news
  getNewsById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const sequelize = News.sequelize;
      
      console.log(`Fetching news with ID: ${id}`);

      // Validate ID
      const newsId = parseInt(id);
      if (isNaN(newsId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid news ID'
        });
      }

      // Use raw SQL query - only select columns that exist in the table
      const query = `
        SELECT 
          [id],
          [title],
          [content],
          [excerpt],
          [image],
          [category],
          [display_order],
          [status],
          [published_date],
          [created_date],
          [modified_date],
          [created_by]
        FROM [dbo].[news]
        WHERE [id] = ${newsId}
          AND [status] = 'active'
      `;

      const newsItems = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT
      });

      if (!newsItems || newsItems.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'News article not found or inactive'
        });
      }

      // Get the news item
      const news = newsItems[0];
      
      // Map image field to image_url for frontend compatibility
      if (news.image && !news.image_url) {
        news.image_url = news.image;
      }

      console.log(`Successfully fetched news: ${news.title}`);

      res.json({
        success: true,
        data: news
      });
    } catch (error) {
      console.error('Error in getNewsById:', error);
      next(error);
    }
  },

  // Create new news (Admin only)
  createNews: async (req, res, next) => {
    try {
      const {
        news_number,
        news_name,
        news_title,
        news_long_description,
        news_short_description,
        news_image1,
        news_image2,
        document,
        status = 'active',
        priority = 0
      } = req.body;

      const news = await News.create({
        news_number,
        news_name,
        news_title,
        news_long_description,
        news_short_description,
        news_image1,
        news_image2,
        document,
        status,
        priority,
        created_date: new Date(),
        created_by: req.user.username,
        modified_date: new Date(),
        modified_by: req.user.username
      });

      res.status(201).json({
        success: true,
        message: 'News created successfully',
        data: news
      });
    } catch (error) {
      next(error);
    }
  },

  // Update news (Admin only)
  updateNews: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        modified_date: new Date(),
        modified_by: req.user.username
      };

      const news = await News.findByPk(id);

      if (!news) {
        return res.status(404).json({
          success: false,
          message: 'News not found'
        });
      }

      await news.update(updateData);

      const updatedNews = await News.findByPk(id);

      res.json({
        success: true,
        message: 'News updated successfully',
        data: updatedNews
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete news (Admin only)
  deleteNews: async (req, res, next) => {
    try {
      const { id } = req.params;

      const news = await News.findByPk(id);

      if (!news) {
        return res.status(404).json({
          success: false,
          message: 'News not found'
        });
      }

      await news.destroy();

      res.json({
        success: true,
        message: 'News deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Get latest news for dashboard
  getLatestNews: async (req, res, next) => {
    try {
      const { limit = 5 } = req.query;

      const news = await News.findAll({
        where: { status: 'active' },
        limit: parseInt(limit),
        order: [['created_date', 'DESC'], ['priority', 'ASC']]
      });

      res.json({
        success: true,
        data: news
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all active news from [news] table using raw SQL (for dashboard)
  getLatestNewsRaw: async (req, res, next) => {
    try {
      const sequelize = News.sequelize;

      const query = `
        SELECT 
          [id],
          [title],
          [content],
          [excerpt],
          [image],
          [category],
          [display_order],
          [status],
          [published_date],
          [created_date],
          [modified_date],
          [created_by]
        FROM [dbo].[news]
        WHERE [status] = 'active'
        ORDER BY [published_date] DESC, [display_order] ASC
      `;

      const newsItems = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT
      });

      res.json({
        success: true,
        data: newsItems
      });
    } catch (error) {
      console.error('Error fetching news:', error);
      next(error);
    }
  }
};

module.exports = newsController;