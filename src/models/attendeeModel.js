// src/database/models/Attendee.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Attendee = sequelize.define('Attendee', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  eventId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Events',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'declined', 'no-show'),
    defaultValue: 'pending',
    allowNull: false
  },
  checkedInAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'eventId']
    },
    {
      fields: ['eventId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['status']
    }
  ]
});

// Define associations in a separate function to avoid circular dependencies
export const setupAttendeeAssociations = (models) => {
  Attendee.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  Attendee.belongsTo(models.Event, {
    foreignKey: 'eventId',
    as: 'event'
  });
};

export default Attendee;