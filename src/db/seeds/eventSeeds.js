// src/database/seeds/eventSeeds.js
import Event from '../../models/eventModel.js';
import User from '../../models/userModel.js';
import Category from '../../models/categoryModel.js';
import logger from '../../utils/logger.js';
import { faker } from '@faker-js/faker';
import config from '../../../src/config/config.js';

// Set a consistent seed for reproducible data
faker.seed(config.db.seeding.randomSeed);

/**
 * Seed events into the database
 * @param {number} count - Number of events to create
 * @returns {Promise<Array>} Array of created events
 */
export async function seedEvents(count = 20) {
  try {
    // Get users and categories for relationships
    const users = await User.findAll();
    const categories = await Category.findAll();
    
    if (users.length === 0) {
      throw new Error('No users found. Please seed users first.');
    }
    
    if (categories.length === 0) {
      throw new Error('No categories found. Please seed categories first.');
    }
    
    // Create events
    const events = [];
    
    // Create some events in the past
    const pastEventsCount = Math.floor(count * 0.3); // 30% of events in the past
    for (let i = 0; i < pastEventsCount; i++) {
      const startDate = faker.date.past({ years: 1 });
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + faker.number.int({ min: 1, max: 8 }));
      
      events.push({
        title: faker.lorem.words({ min: 2, max: 5 }),
        description: faker.lorem.paragraphs(2),
        startDate,
        endDate,
        location: `${faker.location.streetAddress()}, ${faker.location.city()}`,
        locationLat: parseFloat(faker.location.latitude()),
        locationLng: parseFloat(faker.location.longitude()),
        maxAttendees: faker.number.int({ min: 10, max: 200 }),
        isPublic: faker.datatype.boolean(0.8), // 80% chance of being public
        image: faker.image.url(),
        organizerId: users[faker.number.int({ min: 0, max: users.length - 1 })].id,
        categoryId: categories[faker.number.int({ min: 0, max: categories.length - 1 })].id,
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: new Date()
      });
    }
    
    // Create events in the future
    const futureEventsCount = count - pastEventsCount;
    for (let i = 0; i < futureEventsCount; i++) {
      const startDate = faker.date.future({ years: 1 });
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + faker.number.int({ min: 1, max: 8 }));
      
      events.push({
        title: faker.lorem.words({ min: 2, max: 5 }),
        description: faker.lorem.paragraphs(2),
        startDate,
        endDate,
        location: `${faker.location.streetAddress()}, ${faker.location.city()}`,
        locationLat: parseFloat(faker.location.latitude()),
        locationLng: parseFloat(faker.location.longitude()),
        maxAttendees: faker.number.int({ min: 10, max: 200 }),
        isPublic: faker.datatype.boolean(0.8), // 80% chance of being public
        image: faker.image.url(),
        organizerId: users[faker.number.int({ min: 0, max: users.length - 1 })].id,
        categoryId: categories[faker.number.int({ min: 0, max: categories.length - 1 })].id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Create events in database
    const createdEvents = await Event.bulkCreate(events);
    
    logger.info(`Seeded ${createdEvents.length} events`);
    return createdEvents;
  } catch (error) {
    logger.error(`Error seeding events: ${error.message}`);
    throw error;
  }
}