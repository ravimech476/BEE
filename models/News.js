module.exports = (sequelize, DataTypes) => {
  const News = sequelize.define('News', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 500]
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    excerpt: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Short description/summary of the news'
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'URL or path to news image'
    },
    display_order: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Order for displaying news items'
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
      validate: {
        isIn: [['active', 'inactive', 'draft']]
      }
    },
    published_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
      comment: 'Date when news was/will be published'
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
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'User ID who created this news'
    },
    modified_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'User ID who last modified this news'
    }
  }, {
    tableName: 'company_news',
    timestamps: false
  });

  return News;
};