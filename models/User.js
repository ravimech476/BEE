module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [3, 100]
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [6, 255]
      }
    },
    email_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    customer_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    role: {
      type: DataTypes.ENUM('admin', 'customer'), // Keep original enum for SQL Server compatibility
      allowNull: false,
      defaultValue: 'customer'
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tbl_roles',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active'
    },
    last_login_datetime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tbl_users',
        key: 'id'
      }
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
    tableName: 'tbl_users',
    timestamps: false,
    hooks: {
      beforeUpdate: (user) => {
        user.modified_date = new Date();
      }
    }
  });

  User.associate = (models) => {
    User.hasMany(models.LoginLog, {
      foreignKey: 'login_id',
      sourceKey: 'id',
      as: 'loginLogs'
    });
    User.hasMany(models.PageLog, {
      foreignKey: 'login_id',
      sourceKey: 'id',
      as: 'pageLogs'
    });
    User.belongsTo(models.Role, {
      foreignKey: 'role_id',
      as: 'userRole'
    });
    User.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });
    User.hasMany(models.User, {
      foreignKey: 'created_by',
      as: 'createdUsers'
    });
    User.hasMany(models.MeetingMinute, {
      foreignKey: 'created_by',
      as: 'meetingMinutes'
    });
  };

  return User;
};