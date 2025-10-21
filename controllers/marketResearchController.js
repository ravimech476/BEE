const { MarketResearch } = require('../models');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'market-research');

    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
    const allowedDocTypes = /pdf|doc|docx|xls|xlsx/;
    const extname = allowedImageTypes.test(path.extname(file.originalname).toLowerCase()) ||
      allowedDocTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedImageTypes.test(file.mimetype) ||
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Middleware for handling file uploads
const uploadFields = upload.fields([
  { name: 'research_image1', maxCount: 1 },
  { name: 'research_image2', maxCount: 1 },
  { name: 'document', maxCount: 1 }
]);

const marketResearchController = {
  // Get all market research (with filtering and pagination)
  getAllMarketResearch: async (req, res, next) => {
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
          { research_name: { [Op.like]: `%${search}%` } },
          { research_title: { [Op.like]: `%${search}%` } },
          { research_short_description: { [Op.like]: `%${search}%` } }
        ];
      }

      // Add status filter
      if (status) {
        whereClause.status = status;
      }

      // For customers, only show active research
      if (req.user.role === 'customer') {
        whereClause.status = 'active';
      }

      const { count, rows } = await MarketResearch.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, sortOrder.toUpperCase()], ['created_date', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          research: rows,
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

  // Get single market research
  getMarketResearchById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const whereClause = { id };

      // For customers, only show active research
      if (req.user.role === 'customer') {
        whereClause.status = 'active';
      }

      const research = await MarketResearch.findOne({ where: whereClause });

      if (!research) {
        return res.status(404).json({
          success: false,
          message: 'Market research not found'
        });
      }

      res.json({
        success: true,
        data: research
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new market research (Admin only)
  createMarketResearch: async (req, res, next) => {
    try {
      const {
        research_number,
        research_name,
        research_title,
        research_long_description,
        video_link,
        research_short_description,
        status = 'active',
        priority = 0
      } = req.body;

      // Handle file uploads
      const research_image1 = req.files?.research_image1?.[0]
        ? `/uploads/market-research/${req.files.research_image1[0].filename}`
        : req.body.research_image1 || null;

      const research_image2 = req.files?.research_image2?.[0]
        ? `/uploads/market-research/${req.files.research_image2[0].filename}`
        : req.body.research_image2 || null;

      const document = req.files?.document?.[0]
        ? `/uploads/market-research/${req.files.document[0].filename}`
        : req.body.document || null;
      const video_links = req.body.video_link || null;
      const research = await MarketResearch.create({
        research_number,
        research_name,
        research_title,
        research_long_description,
        video_links,
        research_short_description,
        research_image1,
        research_image2,
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
        message: 'Market research created successfully',
        data: research
      });
    } catch (error) {
      // Clean up uploaded files if error occurs
      if (req.files) {
        const files = [...(req.files.research_image1 || []),
        ...(req.files.research_image2 || []),
        ...(req.files.document || [])];
        for (const file of files) {
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
          }
        }
      }
      next(error);
    }
  },

  // Update market research (Admin only)
  updateMarketResearch: async (req, res, next) => {
    try {
      const { id } = req.params;

      const research = await MarketResearch.findByPk(id);

      if (!research) {
        return res.status(404).json({
          success: false,
          message: 'Market research not found'
        });
      }

      // Handle file uploads and existing file retention
      const research_image1 = req.files?.research_image1?.[0]
        ? `/uploads/market-research/${req.files.research_image1[0].filename}`
        : (req.body.existing_research_image1 || req.body.research_image1 || null);

      const research_image2 = req.files?.research_image2?.[0]
        ? `/uploads/market-research/${req.files.research_image2[0].filename}`
        : (req.body.existing_research_image2 || req.body.research_image2 || null);

      const document = req.files?.document?.[0]
        ? `/uploads/market-research/${req.files.document[0].filename}`
        : (req.body.existing_document || req.body.document || null);

      // Delete old files if new ones are uploaded
      if (req.files?.research_image1?.[0] && research.research_image1) {
        try {
          const oldPath = path.join(__dirname, '..', research.research_image1);
          await fs.unlink(oldPath);
        } catch (error) {
          console.error('Error deleting old image1:', error);
        }
      }

      if (req.files?.research_image2?.[0] && research.research_image2) {
        try {
          const oldPath = path.join(__dirname, '..', research.research_image2);
          await fs.unlink(oldPath);
        } catch (error) {
          console.error('Error deleting old image2:', error);
        }
      }

      if (req.files?.document?.[0] && research.document) {
        try {
          const oldPath = path.join(__dirname, '..', research.document);
          await fs.unlink(oldPath);
        } catch (error) {
          console.error('Error deleting old document:', error);
        }
      }

      const updateData = {
        ...req.body,
        research_image1,
        research_image2,
        document,
        modified_date: new Date(),
        modified_by: req.user.username
      };

      // Remove file-related fields that shouldn't be in the update
      delete updateData.existing_research_image1;
      delete updateData.existing_research_image2;
      delete updateData.existing_document;

      await research.update(updateData);

      const updatedResearch = await MarketResearch.findByPk(id);

      res.json({
        success: true,
        message: 'Market research updated successfully',
        data: updatedResearch
      });
    } catch (error) {
      // Clean up uploaded files if error occurs
      if (req.files) {
        const files = [...(req.files.research_image1 || []),
        ...(req.files.research_image2 || []),
        ...(req.files.document || [])];
        for (const file of files) {
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
          }
        }
      }
      next(error);
    }
  },

  // Delete market research (Admin only)
  deleteMarketResearch: async (req, res, next) => {
    try {
      const { id } = req.params;

      const research = await MarketResearch.findByPk(id);

      if (!research) {
        return res.status(404).json({
          success: false,
          message: 'Market research not found'
        });
      }

      await research.destroy();

      res.json({
        success: true,
        message: 'Market research deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Get latest market research for dashboard
  getLatestMarketResearch: async (req, res, next) => {
    try {
      const { limit = 5 } = req.query;

      const research = await MarketResearch.findAll({
        where: { status: 'active' },
        limit: parseInt(limit),
        order: [['created_date', 'DESC'], ['priority', 'ASC']]
      });

      res.json({
        success: true,
        data: research
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = { marketResearchController, uploadFields };