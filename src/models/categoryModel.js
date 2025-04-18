// src/database/models/Category.js
import { DataTypes } from 'sequelize';
import sequelize from '../config.js';

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['name']
    }
  ]
});

// Define associations in a separate function to avoid circular dependencies
export const setupCategoryAssociations = (models) => {
  Category.hasMany(models.Event, {
    foreignKey: 'categoryId',
    as: 'events'
  });
};

export default Category;