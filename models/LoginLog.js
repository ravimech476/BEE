module.exports = (sequelize, DataTypes) => {
  const LoginLog = sequelize.define('LoginLog', {
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
    login_datetime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    logout_datetime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'tbl_login_log',
    timestamps: false
  });

  LoginLog.associate = (models) => {
    LoginLog.belongsTo(models.User, {
      foreignKey: 'login_id',
      targetKey: 'id',
      as: 'user'
    });
  };

  return LoginLog;
};