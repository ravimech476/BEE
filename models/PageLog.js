module.exports = (sequelize, DataTypes) => {
  const PageLog = sequelize.define('PageLog', {
    sl_no: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    login_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tbl_users',
        key: 'id'
      }
    },
    page_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    datetime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    session_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Action performed (view, create, edit, delete)'
    }
  }, {
    tableName: 'tbl_page_log',
    timestamps: false
  });

  PageLog.associate = (models) => {
    PageLog.belongsTo(models.User, {
      foreignKey: 'login_id',
      targetKey: 'id',
      as: 'user'
    });
  };

  return PageLog;
};