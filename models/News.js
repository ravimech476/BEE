module.exports = (sequelize, DataTypes) => {
  const News = sequelize.define('News', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    news_number: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    news_name: {
      type: DataTypes.STRING(250),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 250]
      }
    },
    news_title: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    news_long_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    news_short_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    news_image1: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'URL of the first image'
    },
    news_image2: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'URL of the second image'
    },
    document: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'URL of the document'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active'
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Priority for display order'
    },
    created_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    created_by: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    modified_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    modified_by: {
      type: DataTypes.STRING(100),
      allowNull: true
    }
  }, {
    tableName: 'tbl_news',
    timestamps: false,
    hooks: {
      beforeUpdate: (news) => {
        news.modified_date = new Date();
      }
    }
  });

  return News;
};