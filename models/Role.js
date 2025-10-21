module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    role_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [3, 100]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    permissions: {
    type: DataTypes.TEXT, // Store as TEXT and handle JSON parsing in getters/setters
    allowNull: false,
    defaultValue: JSON.stringify({
    dashboard: {
    view: false
    },
    users: {
    view: false,
    add: false,
    edit: false,
    delete: false
    },
    roles: {
    view: false,
    add: false,
    edit: false,
    delete: false
    },
    products: {
    view: false,
    add: false,
    edit: false,
    delete: false
    },
    orders: {
    view: false,
    add: false,
    edit: false,
    delete: false
    },
    meetings: {
    view: false,
    add: false,
    edit: false,
    delete: false
    },
    market_reports: {
    view: false,
    add: false,
    edit: false,
    delete: false
    },
    payments: {
    view: false,
    add: false,
    edit: false,
    delete: false
    },
      invoice_delivery: {
            view: false,
            add: false,
            edit: false,
            delete: false
          }
        }),
      get() {
        const rawValue = this.getDataValue('permissions');
        try {
          const parsed = rawValue ? JSON.parse(rawValue) : {};
          
          // Ensure all modules have CRUD permissions structure
          const defaultPermissions = {
            dashboard: { view: false },
            users: { view: false, add: false, edit: false, delete: false },
            roles: { view: false, add: false, edit: false, delete: false },
            products: { view: false, add: false, edit: false, delete: false },
            orders: { view: false, add: false, edit: false, delete: false },
            meetings: { view: false, add: false, edit: false, delete: false },
            market_reports: { view: false, add: false, edit: false, delete: false },
            payments: { view: false, add: false, edit: false, delete: false },
            invoice_delivery: { view: false, add: false, edit: false, delete: false }
          };

          // Merge with defaults to ensure structure
          Object.keys(defaultPermissions).forEach(module => {
            if (!parsed[module]) {
              parsed[module] = defaultPermissions[module];
            } else {
              // Ensure all CRUD operations exist
              Object.keys(defaultPermissions[module]).forEach(operation => {
                if (parsed[module][operation] === undefined) {
                  parsed[module][operation] = false;
                }
              });
            }
          });

          return parsed;
        } catch (e) {
          return {
            dashboard: { view: false },
            users: { view: false, add: false, edit: false, delete: false },
            roles: { view: false, add: false, edit: false, delete: false },
            products: { view: false, add: false, edit: false, delete: false },
            orders: { view: false, add: false, edit: false, delete: false },
            meetings: { view: false, add: false, edit: false, delete: false },
            market_reports: { view: false, add: false, edit: false, delete: false },
            payments: { view: false, add: false, edit: false, delete: false },
            invoice_delivery: { view: false, add: false, edit: false, delete: false }
          };
        }
      },
      set(value) {
        this.setDataValue('permissions', JSON.stringify(value));
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active'
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
    tableName: 'tbl_roles',
    timestamps: false,
    hooks: {
      beforeUpdate: (role) => {
        role.modified_date = new Date();
      }
    }
  });

  Role.associate = (models) => {
    Role.hasMany(models.User, {
      foreignKey: 'role_id',
      as: 'users'
    });
    Role.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });
  };

  return Role;
};