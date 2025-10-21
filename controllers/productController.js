const { Product } = require('../models');
const { Op } = require('sequelize');
const { deleteOldImage } = require('../middleware/imageUpload');
const path = require('path');

// Helper function to format image URLs
const formatImageUrls = (product, req) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  // Create a copy of the product data
  const productData = product.toJSON ? product.toJSON() : { ...product };
  
  // Format image URLs
  if (productData.product_image1) {
    // If it's already a full URL, keep it as is
    if (productData.product_image1.startsWith('http')) {
      productData.image1_url = productData.product_image1;
    } else {
      // If it's a relative path, create full URL
      // Remove leading 'uploads/' if present to avoid duplication
      const cleanPath = productData.product_image1.startsWith('uploads/') 
        ? productData.product_image1.substring(8) 
        : productData.product_image1;
      productData.image1_url = `${baseUrl}/uploads/${cleanPath}`;
    }
  } else {
    productData.image1_url = null;
  }
  
  if (productData.product_image2) {
    // If it's already a full URL, keep it as is
    if (productData.product_image2.startsWith('http')) {
      productData.image2_url = productData.product_image2;
    } else {
      // If it's a relative path, create full URL
      // Remove leading 'uploads/' if present to avoid duplication
      const cleanPath = productData.product_image2.startsWith('uploads/') 
        ? productData.product_image2.substring(8) 
        : productData.product_image2;
      productData.image2_url = `${baseUrl}/uploads/${cleanPath}`;
    }
  } else {
    productData.image2_url = null;
  }
  
  return productData;
};

// Helper function to format multiple products
const formatProductsWithImages = (products, req) => {
  return products.map(product => formatImageUrls(product, req));
};

const productController = {
  // Get all products (with filtering and pagination)
  getAllProducts: async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        product_group,
        sortBy = 'priority',
        sortOrder = 'ASC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Add search condition
      if (search) {
        whereClause[Op.or] = [
          { product_name: { [Op.like]: `%${search}%` } },
          { product_number: { [Op.like]: `%${search}%` } },
          { product_short_description: { [Op.like]: `%${search}%` } }
        ];
      }

      // Add status filter
      if (status) {
        whereClause.status = status;
      }

      // Add product group filter
      if (product_group) {
        whereClause.product_group = product_group;
      }

      // For customers, only show active products
      if (req.user.role === 'customer') {
        whereClause.status = 'active';
      }

      const { count, rows } = await Product.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, sortOrder.toUpperCase()]]
      });

      // Format products with image URLs
      const productsWithImages = formatProductsWithImages(rows, req);

      res.json({
        success: true,
        data: {
          products: productsWithImages,
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

  // Get single product
  getProductById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const whereClause = { id };

      // For customers, only show active products
      if (req.user.role === 'customer') {
        whereClause.status = 'active';
      }

      const product = await Product.findOne({ where: whereClause });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Format product with image URLs
      const productWithImages = formatImageUrls(product, req);

      res.json({
        success: true,
        data: productWithImages
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new product (Admin only)
  createProduct: async (req, res, next) => {
    try {
      const {
        product_number,
        product_name,
        product_long_description,
        uom,
        product_short_description,
        product_group,
        status = 'active',
        priority = 0,
        additional,
        additional2
      } = req.body;

      // Handle uploaded images
      let product_image1 = req.body.product_image1 || null;
      let product_image2 = req.body.product_image2 || null;

      // If files were uploaded, use their paths
      if (req.files) {
        if (req.files.image1 && req.files.image1[0]) {
          product_image1 = `products/images/${req.files.image1[0].filename}`;
        }
        if (req.files.image2 && req.files.image2[0]) {
          product_image2 = `products/images/${req.files.image2[0].filename}`;
        }
      }

      const product = await Product.create({
        product_number,
        product_name,
        product_long_description,
        uom,
        product_short_description,
        product_image1,
        product_image2,
        product_group,
        status,
        priority,
        additional,
        additional2,
        created_date: new Date(),
        modified_date: new Date()
      });

      // Format product with image URLs
      const productWithImages = formatImageUrls(product, req);

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: productWithImages
      });
    } catch (error) {
      next(error);
    }
  },

  // Update product (Admin only)
  updateProduct: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const product = await Product.findByPk(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Prepare update data
      const updateData = { ...req.body, modified_date: new Date() };
      
      // Handle image uploads
      if (req.files) {
        if (req.files.image1 && req.files.image1[0]) {
          // Delete old image1 if it exists
          if (product.product_image1) {
            deleteOldImage(product.product_image1);
          }
          updateData.product_image1 = `products/images/${req.files.image1[0].filename}`;
        }
        
        if (req.files.image2 && req.files.image2[0]) {
          // Delete old image2 if it exists
          if (product.product_image2) {
            deleteOldImage(product.product_image2);
          }
          updateData.product_image2 = `products/images/${req.files.image2[0].filename}`;
        }
      }

      // Handle image removal flags
      if (req.body.remove_image1 === 'true') {
        if (product.product_image1) {
          deleteOldImage(product.product_image1);
        }
        updateData.product_image1 = null;
      }
      
      if (req.body.remove_image2 === 'true') {
        if (product.product_image2) {
          deleteOldImage(product.product_image2);
        }
        updateData.product_image2 = null;
      }

      await product.update(updateData);

      const updatedProduct = await Product.findByPk(id);

      // Format product with image URLs
      const productWithImages = formatImageUrls(updatedProduct, req);

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: productWithImages
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete product (Admin only)
  deleteProduct: async (req, res, next) => {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      await product.destroy();

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Get product groups
  getProductGroups: async (req, res, next) => {
    try {
      const groups = await Product.findAll({
        attributes: ['product_group'],
        where: {
          product_group: { [Op.ne]: null },
          ...(req.user.role === 'customer' && { status: 'active' })
        },
        group: ['product_group']
      });

      const productGroups = groups.map(group => group.product_group);

      res.json({
        success: true,
        data: productGroups
      });
    } catch (error) {
      next(error);
    }
  },

  // Bulk update product status (Admin only)
  bulkUpdateStatus: async (req, res, next) => {
    try {
      const { productIds, status } = req.body;

      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Product IDs are required'
        });
      }

      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value'
        });
      }

      await Product.update(
        { status, modified_date: new Date() },
        { where: { id: { [Op.in]: productIds } } }
      );

      res.json({
        success: true,
        message: `${productIds.length} products updated successfully`
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = productController;