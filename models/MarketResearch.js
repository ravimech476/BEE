module.exports = (sequelize, DataTypes) => {
  const MarketResearch = sequelize.define('MarketResearch', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    research_number: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    research_name: {
      type: DataTypes.STRING(250),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 250]
      }
    },
    research_title: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    research_long_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    video_link: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    research_short_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    research_image1: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'URL of the first image'
    },
    research_image2: {
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
    customer_code: {
      type: DataTypes.STRING(50),
      allowNull: true
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
    tableName: 'tbl_market_research',
    timestamps: false,
    hooks: {
      beforeUpdate: (research) => {
        research.modified_date = new Date();
      }
    }
  });

  return MarketResearch;
};