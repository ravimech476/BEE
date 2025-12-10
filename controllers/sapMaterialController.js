const { SapMaterial, Product } = require('../models');
const { Op } = require('sequelize');

const sapMaterialController = {
  // Get all SAP materials with pagination and search
  getAllSapMaterials: async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        sortBy = 'created_date',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Add search condition
      if (search) {
        whereClause.sap_material_number = { [Op.like]: `%${search}%` };
      }

      // Add status filter
      if (status) {
        whereClause.status = status;
      }

      const { count, rows } = await SapMaterial.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, sortOrder.toUpperCase()]]
      });

      res.json({
        success: true,
        data: {
          sapMaterials: rows,
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

  // Get active SAP materials (for dropdown)
  getActiveSapMaterials: async (req, res, next) => {
    try {
      const materials = await SapMaterial.findAll({
        where: { status: 'active' },
        attributes: ['id', 'sap_material_number'],
        order: [['sap_material_number', 'ASC']]
      });

      res.json({
        success: true,
        data: materials
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single SAP material by ID
  getSapMaterialById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const material = await SapMaterial.findByPk(id, {
        include: [{
          model: Product,
          as: 'products',
          attributes: ['id', 'product_number', 'product_name', 'common_name'],
          through: { attributes: [] }
        }]
      });

      if (!material) {
        return res.status(404).json({
          success: false,
          message: 'SAP Material not found'
        });
      }

      res.json({
        success: true,
        data: material
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new SAP material
  createSapMaterial: async (req, res, next) => {
    try {
      const { sap_material_number, status = 'active' } = req.body;

      // Validate required field
      if (!sap_material_number || !sap_material_number.trim()) {
        return res.status(400).json({
          success: false,
          message: 'SAP Material Number is required'
        });
      }

      // Check for duplicate
      const existing = await SapMaterial.findOne({
        where: { sap_material_number: sap_material_number.trim() }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'SAP Material Number already exists'
        });
      }

      const material = await SapMaterial.create({
        sap_material_number: sap_material_number.trim(),
        status
      });

      res.status(201).json({
        success: true,
        message: 'SAP Material created successfully',
        data: material
      });
    } catch (error) {
      next(error);
    }
  },

  // Update SAP material
  updateSapMaterial: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { sap_material_number, status } = req.body;

      const material = await SapMaterial.findByPk(id);

      if (!material) {
        return res.status(404).json({
          success: false,
          message: 'SAP Material not found'
        });
      }

      // Check for duplicate if changing the number
      if (sap_material_number && sap_material_number.trim() !== material.sap_material_number) {
        const existing = await SapMaterial.findOne({
          where: {
            sap_material_number: sap_material_number.trim(),
            id: { [Op.ne]: id }
          }
        });

        if (existing) {
          return res.status(400).json({
            success: false,
            message: 'SAP Material Number already exists'
          });
        }
      }

      const updateData = {};

      if (sap_material_number) {
        updateData.sap_material_number = sap_material_number.trim();
      }

      if (status) {
        updateData.status = status;
      }

      await material.update(updateData);

      res.json({
        success: true,
        message: 'SAP Material updated successfully',
        data: material
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete SAP material
  deleteSapMaterial: async (req, res, next) => {
    try {
      const { id } = req.params;

      const material = await SapMaterial.findByPk(id, {
        include: [{
          model: Product,
          as: 'products',
          attributes: ['id']
        }]
      });

      if (!material) {
        return res.status(404).json({
          success: false,
          message: 'SAP Material not found'
        });
      }

      // Check if material is linked to any products
      if (material.products && material.products.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete SAP Material. It is linked to ${material.products.length} product(s). Remove the associations first.`
        });
      }

      await material.destroy();

      res.json({
        success: true,
        message: 'SAP Material deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = sapMaterialController;
