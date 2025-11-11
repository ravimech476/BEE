const { Product } = require("../models");
const { Op } = require("sequelize");
const { deleteOldImage } = require("../middleware/imageUpload");
const path = require("path");

// Helper function to format image URLs
const formatImageUrls = (product, req) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  // Create a copy of the product data
  const productData = product.toJSON ? product.toJSON() : { ...product };

  // Format image URLs
  if (productData.product_image1) {
    // If it's already a full URL, keep it as is
    if (productData.product_image1.startsWith("http")) {
      productData.image1_url = productData.product_image1;
    } else {
      // If it's a relative path, create full URL
      // Remove leading 'uploads/' if present to avoid duplication
      const cleanPath = productData.product_image1.startsWith("uploads/")
        ? productData.product_image1.substring(8)
        : productData.product_image1;
      productData.image1_url = `${baseUrl}/uploads/${cleanPath}`;
    }
  } else {
    productData.image1_url = null;
  }

  if (productData.product_image2) {
    // If it's already a full URL, keep it as is
    if (productData.product_image2.startsWith("http")) {
      productData.image2_url = productData.product_image2;
    } else {
      // If it's a relative path, create full URL
      // Remove leading 'uploads/' if present to avoid duplication
      const cleanPath = productData.product_image2.startsWith("uploads/")
        ? productData.product_image2.substring(8)
        : productData.product_image2;
      productData.image2_url = `${baseUrl}/uploads/${cleanPath}`;
    }
  } else {
    productData.image2_url = null;
  }

  // Format harvest region image URL
  if (productData.harvest_region_image) {
    if (productData.harvest_region_image.startsWith("http")) {
      productData.harvest_region_image_url = productData.harvest_region_image;
    } else {
      const cleanPath = productData.harvest_region_image.startsWith("uploads/")
        ? productData.harvest_region_image.substring(8)
        : productData.harvest_region_image;
      productData.harvest_region_image_url = `${baseUrl}/uploads/${cleanPath}`;
    }
  } else {
    productData.harvest_region_image_url = null;
  }

  return productData;
};

// Helper function to format multiple products
const formatProductsWithImages = (products, req) => {
  return products.map((product) => formatImageUrls(product, req));
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
        date,
        sortBy = "priority",
        sortOrder = "ASC",
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};
      const andConditions = [];

      // Add search condition
      if (search) {
        andConditions.push({
          [Op.or]: [
            { product_name: { [Op.like]: `%${search}%` } },
            { product_number: { [Op.like]: `%${search}%` } },
            { product_short_description: { [Op.like]: `%${search}%` } },
          ],
        });
      }

      // Add status filter
      if (status) {
        whereClause.status = status;
      }

      // Add product group filter
      if (product_group) {
        whereClause.product_group = product_group;
      }

      // Add date filter (filter by created_date or modified_date)
      if (date) {
        const filterDate = new Date(date);
        const nextDay = new Date(filterDate);
        nextDay.setDate(nextDay.getDate() + 1);

        andConditions.push({
          [Op.or]: [
            {
              created_date: {
                [Op.gte]: filterDate,
                [Op.lt]: nextDay,
              },
            },
            {
              modified_date: {
                [Op.gte]: filterDate,
                [Op.lt]: nextDay,
              },
            },
          ],
        });
      }

      // Combine AND conditions if they exist
      if (andConditions.length > 0) {
        whereClause[Op.and] = andConditions;
      }

      // For customers, only show active products
      if (req.user.role === "customer") {
        whereClause.status = "active";
      }

      const { count, rows } = await Product.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, sortOrder.toUpperCase()]],
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
            limit: parseInt(limit),
          },
        },
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
      if (req.user.role === "customer") {
        whereClause.status = "active";
      }

      const product = await Product.findOne({ where: whereClause });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Format product with image URLs
      const productWithImages = formatImageUrls(product, req);

      res.json({
        success: true,
        data: productWithImages,
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
        common_name,
        botanical_name,
        plant_part,
        source_country,
        harvest_region_new,
        peak_season_enabled,
        peak_season_months,
        harvest_season_enabled,
        harvest_season_months,
        material,
        procurement_method,
        main_components,
        sensory_notes,
        color_absolute,
        extraction_process,
        applications_uses,
        production_availability,
        product_long_description,
        uom,
        product_short_description,
        product_group,
        status = "active",
        priority = 0,
      } = req.body;

      // Use common_name as product_name if product_name is not provided
      const product_name =
        req.body.product_name || common_name || product_number;

      // Handle uploaded images
      let product_image1 = req.body.product_image1 || null;
      let product_image2 = req.body.product_image2 || null;
      let harvest_region_image = req.body.harvest_region_image || null;

      // If files were uploaded, use their paths
      if (req.files) {
        if (req.files.image1 && req.files.image1[0]) {
          product_image1 = `products/images/${req.files.image1[0].filename}`;
        }
        if (req.files.image2 && req.files.image2[0]) {
          product_image2 = `products/images/${req.files.image2[0].filename}`;
        }
        if (
          req.files.harvest_region_image &&
          req.files.harvest_region_image[0]
        ) {
          harvest_region_image = `products/harvest-regions/${req.files.harvest_region_image[0].filename}`;
        }
      }

      const product = await Product.create({
        product_number,
        product_name,
        common_name,
        botanical_name,
        plant_part,
        source_country,
        harvest_region_new,
        harvest_region_image,
        peak_season_enabled:
          peak_season_enabled === "true" || peak_season_enabled === true,
        peak_season_months,
        harvest_season_enabled:
          harvest_season_enabled === "true" || harvest_season_enabled === true,
        harvest_season_months,
        material,
        procurement_method,
        main_components,
        sensory_notes,
        color_absolute,
        extraction_process,
        applications_uses,
        production_availability,
        product_long_description,
        uom,
        product_short_description,
        product_image1,
        product_image2,
        product_group,
        status,
        priority,
        created_date: new Date(),
        modified_date: new Date(),
      });

      // Format product with image URLs
      const productWithImages = formatImageUrls(product, req);

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: productWithImages,
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
          message: "Product not found",
        });
      }

      // Prepare update data
      const updateData = { ...req.body, modified_date: new Date() };

      // Use common_name as product_name if product_name is not provided
      if (!updateData.product_name && updateData.common_name) {
        updateData.product_name = updateData.common_name;
      }

      // Handle boolean conversions for season fields
      if (typeof updateData.peak_season_enabled === "string") {
        updateData.peak_season_enabled =
          updateData.peak_season_enabled === "true";
      }
      if (typeof updateData.harvest_season_enabled === "string") {
        updateData.harvest_season_enabled =
          updateData.harvest_season_enabled === "true";
      }

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

        if (
          req.files.harvest_region_image &&
          req.files.harvest_region_image[0]
        ) {
          // Delete old harvest region image if it exists
          if (product.harvest_region_image) {
            deleteOldImage(product.harvest_region_image);
          }
          updateData.harvest_region_image = `products/harvest-regions/${req.files.harvest_region_image[0].filename}`;
        }
      }

      // Handle image removal flags
      if (req.body.remove_image1 === "true") {
        if (product.product_image1) {
          deleteOldImage(product.product_image1);
        }
        updateData.product_image1 = null;
      }

      if (req.body.remove_image2 === "true") {
        if (product.product_image2) {
          deleteOldImage(product.product_image2);
        }
        updateData.product_image2 = null;
      }

      if (req.body.remove_harvest_region_image === "true") {
        if (product.harvest_region_image) {
          deleteOldImage(product.harvest_region_image);
        }
        updateData.harvest_region_image = null;
      }

      await product.update(updateData);

      const updatedProduct = await Product.findByPk(id);

      // Format product with image URLs
      const productWithImages = formatImageUrls(updatedProduct, req);

      res.json({
        success: true,
        message: "Product updated successfully",
        data: productWithImages,
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
          message: "Product not found",
        });
      }

      await product.destroy();

      res.json({
        success: true,
        message: "Product deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  // Get product groups
  getProductGroups: async (req, res, next) => {
    try {
      const groups = await Product.findAll({
        attributes: ["product_group"],
        where: {
          product_group: { [Op.ne]: null },
          ...(req.user.role === "customer" && { status: "active" }),
        },
        group: ["product_group"],
      });

      const productGroups = groups.map((group) => group.product_group);

      res.json({
        success: true,
        data: productGroups,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get top products by sales amount with priority fallback
  // Get top products by sales amount with priority fallback
  // Get top products by sales amount with priority fallback
  // REPLACE THE getTopProductsBySales FUNCTION WITH THIS CODE:

  // Get top products by sales amount with priority fallback
  getTopProductsBySales: async (req, res, next) => {
    try {
      const { limit = 3, customer_code } = req.query;
      const sequelize = Product.sequelize;

      const limitValue = parseInt(limit);

      let query, replacements;

      if (customer_code) {
        // Query with customer filter using d2d_sales
        query = `WITH ProductSummary AS (
    SELECT
        material_no,
        SUM(TRY_CAST(qty AS FLOAT)) AS ProductQuantity
    FROM [customerconnect].[dbo].[d2d_sales]
    WHERE customer_code = :customer_code
    GROUP BY material_no
)
SELECT TOP 3
    p.*,
    ISNULL(ps.ProductQuantity, 0) AS ProductQuantity
FROM tbl_products p
LEFT JOIN ProductSummary ps 
    ON p.product_number = ps.material_no
WHERE p.status = 'active'
ORDER BY 
    ISNULL(ps.ProductQuantity, 0) DESC;
`;
        replacements = { limit: limitValue, customer_code };
      } else {
        // Query without customer filter - just use priority
        query = `
          SELECT TOP (:limit)
            p.*,
            0 as ProductQuantity,
            0 as ProductTotalValue,
            2 as match_priority
          FROM tbl_products p
          WHERE p.status = 'active'
          ORDER BY ISNULL(p.priority, 0) DESC
        `;
        replacements = { limit: limitValue };
      }

      const products = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT,
      });

      // Format products with image URLs
      const productsWithImages = products.map((product) =>
        formatImageUrls(
          {
            toJSON: () => product,
          },
          req
        )
      );

      res.json({
        success: true,
        data: {
          products: productsWithImages,
          total: products.length,
        },
      });
    } catch (error) {
      console.error("Error fetching top products by sales:", error);
      console.error("Error details:", error.message);
      next(error);
    }
  },

  // KEY CHANGES MADE:
  // 1. Used TRY_CAST instead of CAST to handle data type issues gracefully
  // 2. Simplified the query - removed complex CTEs and UNION
  // 3. Used LEFT JOIN instead of INNER JOIN + separate priority query
  // 4. Used p.* to select all product columns (avoids listing each column)
  // 5. Added better error logging with error.message
  // 6. Separate query paths for with/without customer_code
  // 7. Used :parameter syntax consistently (Sequelize handles conversion)

  // Bulk update product status (Admin only)
  bulkUpdateStatus: async (req, res, next) => {
    try {
      const { productIds, status } = req.body;

      if (
        !productIds ||
        !Array.isArray(productIds) ||
        productIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Product IDs are required",
        });
      }

      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status value",
        });
      }

      await Product.update(
        { status, modified_date: new Date() },
        { where: { id: { [Op.in]: productIds } } }
      );

      res.json({
        success: true,
        message: `${productIds.length} products updated successfully`,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = productController;
