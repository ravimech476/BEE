module.exports = (sequelize, DataTypes) => {
  const ProductSapMaterial = sequelize.define('ProductSapMaterial', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tbl_products',
        key: 'id'
      }
    },
    sap_material_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tbl_sap_materials',
        key: 'id'
      }
    },
    created_date: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'tbl_product_sap_materials',
    timestamps: false
  });

  return ProductSapMaterial;
};
