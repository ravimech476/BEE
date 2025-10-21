module.exports = (sequelize, DataTypes) => {
  const InvoiceToDelivery = sequelize.define('InvoiceToDelivery', {
    sl_no: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    invoice_number: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    invoice_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    invoice_value: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    invoice_value_inr: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    dispatch_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lr_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Lorry Receipt Number'
    },
    delivery_partner: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    delivered_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    customer_code: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'dispatched', 'delivered'),
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
    tableName: 'tbl_invoice_to_delivery',
    timestamps: false,
    hooks: {
      beforeUpdate: (invoice) => {
        invoice.modified_date = new Date();
      }
    }
  });

  return InvoiceToDelivery;
};