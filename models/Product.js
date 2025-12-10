module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    product_number: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    product_name: {
      type: DataTypes.STRING(250),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 250]
      }
    },
    product_long_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    uom: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'Unit of Measurement (nos, kg, etc)'
    },
    product_short_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    product_image1: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'URL of the first image'
    },
    product_image2: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'URL of the second image'
    },
    product_group: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Product group name'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active'
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Priority for display order'
    },
    created_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    // New fields that already exist in your database
    common_name: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Common name of the product'
    },
    botanical_name: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Scientific/Botanical name'
    },
    plant_part: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Part of plant used (Flower, Leaf, Root, etc.)'
    },
    source_country: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Country of origin'
    },
    harvest_region_new: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Harvest regions as JSON array'
    },
    harvest_region_image: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Harvest region image path'
    },
    peak_season_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      comment: 'Whether peak season is applicable'
    },
    peak_season_months: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'JSON array of peak season months'
    },
    harvest_season_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      comment: 'Whether harvest season is applicable'
    },
    harvest_season_months: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'JSON array of harvest season months'
    },
    material: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Material information'
    },
    procurement_method: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Procurement methods as JSON array'
    },
    main_components: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Main chemical components'
    },
    sensory_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Sensory characteristics'
    },
    color_absolute: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Color description of the product'
    },
    extraction_process: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Extraction method'
    },
    applications_uses: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Applications and uses'
    },
    production_availability: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Production availability quantity'
    }
  }, {
    tableName: 'tbl_products',
    timestamps: false,
    hooks: {
      beforeUpdate: (product) => {
        product.modified_date = new Date();
      }
    }
  });

  Product.associate = (models) => {
    Product.belongsToMany(models.SapMaterial, {
      through: 'tbl_product_sap_materials',
      foreignKey: 'product_id',
      otherKey: 'sap_material_id',
      as: 'sapMaterials'
    });
  };

  return Product;
};
