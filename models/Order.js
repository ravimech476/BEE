module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    invoice_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    customer_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    customer_email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    customer_phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    customer_code: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    product_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    invoice_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    delivery_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled']]
      }
    },
    payment_status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'paid', 'partial', 'refunded']]
      }
    },
    shipping_address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'orders',
    timestamps: true,
    underscored: true
  });

  Order.associate = function(models) {
    // Associations removed to avoid join issues
    // The product_name is stored directly in the orders table
    // If needed in future, ensure proper table names are used
  };

  return Order;
};