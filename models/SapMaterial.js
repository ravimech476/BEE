module.exports = (sequelize, DataTypes) => {
  const SapMaterial = sequelize.define('SapMaterial', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    sap_material_number: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
      validate: {
        isIn: [['active', 'inactive']]
      }
    },
    created_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'tbl_sap_materials',
    timestamps: false
  });

  SapMaterial.associate = (models) => {
    SapMaterial.belongsToMany(models.Product, {
      through: 'tbl_product_sap_materials',
      foreignKey: 'sap_material_id',
      otherKey: 'product_id',
      as: 'products'
    });
  };

  return SapMaterial;
};
