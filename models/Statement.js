module.exports = (sequelize, DataTypes) => {
  const Statement = sequelize.define('Statement', {
    sl_no: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    customer_code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    customer_name: {
      type: DataTypes.STRING(250),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    customer_group: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    outstanding_value: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0.00
    },
    invoice_number: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    invoice_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    total_paid_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0.00
    },
    status: {
      type: DataTypes.ENUM('pending', 'partial', 'paid'),
      allowNull: false,
      defaultValue: 'pending'
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
    tableName: 'tbl_statement',
    timestamps: false,
    hooks: {
      beforeUpdate: (statement) => {
        statement.modified_date = new Date();
      }
    }
  });

  return Statement;
};