// src/database/seeds/categorySeeds.js
import Category from '../../models/categoryModel.js';
import logger from '../../utils/logger.js';

/**
 * Seed categories into the database
 * @param {number} count - Number of categories to create
 * @returns {Promise<Array>} Array of created categories
 */
export async function seedCategories(count = 5) {
  try {
    // Default categories that will always be created
    const defaultCategories = [
      {
        name: 'Technology',
        description: 'Tech meetups, hackathons, and workshops',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Arts & Culture',
        description: 'Art exhibitions, cultural festivals, and performances',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Health & Wellness',
        description: 'Fitness classes, meditation sessions, and health workshops',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Education',
        description: 'Lectures, workshops, and learning events',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Social',
        description: 'Networking events, parties, and social gatherings',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Additional categories if count is greater than default categories
    const additionalCategories = [];
    if (count > defaultCategories.length) {
      const additionalCount = count - defaultCategories.length;
      
      const additionalCategoryTemplates = [
        {
          name: 'Sports',
          description: 'Sports events, tournaments, and recreational activities'
        },
        {
          name: 'Business',
          description: 'Networking, entrepreneurship, and professional development'
        },
        {
          name: 'Food & Drink',
          description: 'Tastings, cooking classes, and culinary experiences'
        },
        {
          name: 'Music',
          description: 'Concerts, performances, and music festivals'
        },
        {
          name: 'Outdoors',
          description: 'Hiking, camping, and outdoor adventures'
        },
        {
          name: 'Family',
          description: 'Family-friendly events and activities'
        },
        {
          name: 'Charity',
          description: 'Fundraisers, volunteer opportunities, and community service'
        },
        {
          name: 'Science',
          description: 'Science fairs, astronomy nights, and research presentations'
        }
      ];
      
      // Add as many additional categories as needed
      for (let i = 0; i < additionalCount && i < additionalCategoryTemplates.length; i++) {
        additionalCategories.push({
          ...additionalCategoryTemplates[i],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      // If we need even more categories, generate them with numbers
      if (additionalCount > additionalCategoryTemplates.length) {
        const remaining = additionalCount - additionalCategoryTemplates.length;
        for (let i = 0; i < remaining; i++) {
          additionalCategories.push({
            name: `Category ${i + 1}`,
            description: `Description for category ${i + 1}`,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }
    
    // Combine default and additional categories
    const categories = [...defaultCategories, ...additionalCategories].slice(0, count);
    
    // Create categories in database
    const createdCategories = await Category.bulkCreate(categories);
    
    logger.info(`Seeded ${createdCategories.length} categories`);
    return createdCategories;
  } catch (error) {
    logger.error(`Error seeding categories: ${error.message}`);
    throw error;
  }
}