module.exports = (sequelize, DataTypes) => {
  const MeetingMinute = sequelize.define('MeetingMinute', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    mom_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 255]
      }
    },
    meeting_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    attendees: {
      type: DataTypes.TEXT, // Store as TEXT and handle JSON parsing
      allowNull: true,
      defaultValue: JSON.stringify([]),
      get() {
        const rawValue = this.getDataValue('attendees');
        try {
          return rawValue ? JSON.parse(rawValue) : [];
        } catch (e) {
          return [];
        }
      },
      set(value) {
        this.setDataValue('attendees', JSON.stringify(value || []));
      }
    },
    agenda: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    minutes: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    action_items: {
      type: DataTypes.TEXT, // Store as TEXT and handle JSON parsing
      allowNull: true,
      defaultValue: JSON.stringify([]),
      get() {
        const rawValue = this.getDataValue('action_items');
        try {
          return rawValue ? JSON.parse(rawValue) : [];
        } catch (e) {
          return [];
        }
      },
      set(value) {
        this.setDataValue('action_items', JSON.stringify(value || []));
      }
    },
    next_meeting_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    customer_code: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('draft', 'finalized', 'archived'),
      allowNull: false,
      defaultValue: 'draft'
    },
    attachments: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: JSON.stringify([]),
      get() {
        const rawValue = this.getDataValue('attachments');
        try {
          return rawValue ? JSON.parse(rawValue) : [];
        } catch (e) {
          return [];
        }
      },
      set(value) {
        this.setDataValue('attachments', JSON.stringify(value || []));
      }
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    tableName: 'tbl_meeting_minutes',
    timestamps: false,
    hooks: {
      beforeUpdate: (meeting) => {
        meeting.modified_date = new Date();
      }
    }
  });

  MeetingMinute.associate = (models) => {
    MeetingMinute.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });
  };

  return MeetingMinute;
};