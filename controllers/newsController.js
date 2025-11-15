const { News } = require('../models');
const { Op } = require('sequelize');
const { deleteOldNewsImage } = require('../middleware/newsImageUpload');

const newsController = {
  // Get all news (with filtering and pagination)
  getAllNews: async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        sortBy = 'display_order',
        sortOrder = 'ASC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Add search condition
      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { content: { [Op.like]: `%${search}%` } },
          { excerpt: { [Op.like]: `%${search}%` } }
        ];
      }

      // Add status filter
      if (status && status !== 'undefined') {
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

      const news = await News.findOne({
        where: { 
          id,
          status: 'active' 
        }
      });

      if (!news) {
        return res.status(404).json({
          success: false,
          message: 'News article not found or inactive'
        });
      }

      res.json({
        success: true,
        data: news
      });
    } catch (error) {
      console.error('Error in getNewsById:', error);
      next(error);
    }
  },

  // Create new news (Admin only) - Using raw SQL
  createNews: async (req, res, next) => {
    try {
      const {
        title,
        content,
        excerpt,
        display_order = 0,
        status = 'active'
      } = req.body;

      // Handle image upload
      let imagePath = null;
      if (req.file) {
        imagePath = `news/${req.file.filename}`;
      }

      const sequelize = News.sequelize;

      // Use raw SQL to avoid date conversion issues
      const query = `
        INSERT INTO company_news (
          title, content, excerpt, image, 
          display_order, status, 
          created_by, modified_by,
          created_date, modified_date
        ) 
        OUTPUT INSERTED.*
        VALUES (
          :title, :content, :excerpt, :image,
          :display_order, :status,
          :created_by, :modified_by,
          GETDATE(), GETDATE()
        )
      `;

      const [results] = await sequelize.query(query, {
        replacements: {
          title,
          content,
          excerpt: excerpt || null,
          image: imagePath,
          display_order: parseInt(display_order) || 0,
          status,
          created_by: req.user.id,
          modified_by: req.user.id
        },
        type: sequelize.QueryTypes.INSERT
      });

      const news = results[0];

      res.status(201).json({
        success: true,
        message: 'News created successfully',
        data: news
      });
    } catch (error) {
      console.error('Error creating news:', error);
      // If error occurs after file upload, delete the uploaded file
      if (req.file) {
        deleteOldNewsImage(`news/${req.file.filename}`);
      }
      next(error);
    }
  },

  // Update news (Admin only) - Using raw SQL
  updateNews: async (req, res, next) => {
    try {
      const { id } = req.params;

      const news = await News.findByPk(id);

      if (!news) {
        if (req.file) {
          deleteOldNewsImage(`news/${req.file.filename}`);
        }
        return res.status(404).json({
          success: false,
          message: 'News not found'
        });
      }

      // Build SET clause
      const updates = [];
      const replacements = { id: parseInt(id) };

      if (req.body.title !== undefined && req.body.title !== '') {
        updates.push('title = :title');
        replacements.title = req.body.title;
      }
      if (req.body.content !== undefined && req.body.content !== '') {
        updates.push('content = :content');
        replacements.content = req.body.content;
      }
      if (req.body.excerpt !== undefined) {
        updates.push('excerpt = :excerpt');
        replacements.excerpt = req.body.excerpt || null;
      }
      if (req.body.status !== undefined && req.body.status !== '') {
        updates.push('status = :status');
        replacements.status = req.body.status;
      }
      if (req.body.display_order !== undefined) {
        updates.push('display_order = :display_order');
        replacements.display_order = parseInt(req.body.display_order) || 0;
      }

      // Handle image upload
      if (req.file) {
        if (news.image) {
          deleteOldNewsImage(news.image);
        }
        updates.push('image = :image');
        replacements.image = `news/${req.file.filename}`;
      }

      // Always update modified_by and modified_date
      updates.push('modified_by = :modified_by');
      updates.push('modified_date = GETDATE()');
      replacements.modified_by = req.user.id;

      const sequelize = News.sequelize;

      const query = `
        UPDATE company_news 
        SET ${updates.join(', ')}
        OUTPUT INSERTED.*
        WHERE id = :id
      `;

      const [results] = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.UPDATE
      });

      const updatedNews = results[0];

      res.json({
        success: true,
        message: 'News updated successfully',
        data: updatedNews
      });
    } catch (error) {
      console.error('Error updating news:', error);
      if (req.file) {
        deleteOldNewsImage(`news/${req.file.filename}`);
      }
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

      // Delete image file if it exists
      if (news.image) {
        deleteOldNewsImage(news.image);
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
        order: [['created_date', 'DESC'], ['display_order', 'ASC']]
      });

      res.json({
        success: true,
        data: news
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all active news from company_news table (for dashboard)
  getLatestNewsRaw: async (req, res, next) => {
    try {
      const newsItems = await News.findAll({
        where: { status: 'active' },
        order: [
          ['created_date', 'DESC'],
          ['display_order', 'ASC']
        ]
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
