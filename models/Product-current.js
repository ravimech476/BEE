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

  return Product;
};
