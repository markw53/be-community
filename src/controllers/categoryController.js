// src/controllers/categoryController.js
import Category from '../database/models/Category.js';
import Event from '../database/models/Event.js';
import logger from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

/**
 * Get all categories
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });
    
    res.status(200).json({
      status: 'success',
      results: categories.length,
      data: {
        categories
      }
    });
  } catch (error) {
    logger.error(`Error getting categories: ${error.message}`);
    next(error);
  }
};

/**
 * Get a single category by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findByPk(id, {
      include: [
        {
          model: Event,
          as: 'events',
          attributes: ['id', 'title', 'startDate', 'endDate', 'location', 'image'],
          where: { isPublic: true },
          required: false
        }
      ]
    });
    
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        category
      }
    });
  } catch (error) {
    logger.error(`Error getting category: ${error.message}`);
    next(error);
  }
};

/**
 * Create a new category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    
    // Check if category with this name already exists
    const existingCategory = await Category.findOne({ where: { name } });
    if (existingCategory) {
      throw new ValidationError('A category with this name already exists');
    }
    
    const category = await Category.create({
      name,
      description
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        category
      }
    });
  } catch (error) {
    logger.error(`Error creating category: ${error.message}`);
    next(error);
  }
};

/**
 * Update a category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const category = await Category.findByPk(id);
    
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    
    // If name is being changed, check if the new name already exists
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ where: { name } });
      if (existingCategory) {
        throw new ValidationError('A category with this name already exists');
      }
    }
    
    // Update category
    await category.update({
      name: name || category.name,
      description: description !== undefined ? description : category.description
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        category
      }
    });
  } catch (error) {
    logger.error(`Error updating category: ${error.message}`);
    next(error);
  }
};

/**
 * Delete a category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findByPk(id, {
      include: [
        {
          model: Event,
          as: 'events',
          attributes: ['id']
        }
      ]
    });
    
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    
    // Check if category has events
    if (category.events && category.events.length > 0) {
      throw new ValidationError('Cannot delete category that has events. Reassign events first.');
    }
    
    await category.destroy();
    
    res.status(204).send();
  } catch (error) {
    logger.error(`Error deleting category: ${error.message}`);
    next(error);
  }
};

export default {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};