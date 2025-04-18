// src/database/seeds/userSeeds.js
import { User } from '../models/User.js';
import bcrypt from 'bcrypt';
import logger from '../../utils/logger.js';
import { faker } from '@faker-js/faker';
import config from '../../../config/config.js';

// Set a consistent seed for reproducible data
faker.seed(config.db.seeding.randomSeed);

/**
 * Seed users into the database
 * @param {number} count - Number of users to create
 * @returns {Promise<Array>} Array of created users
 */
export async function seedUsers(count = 10) {
  try {
    // Always create these admin and test users
    const defaultUsers = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Admin',
        lastName: 'User',
        bio: 'System administrator',
        profileImage: 'https://randomuser.me/api/portraits/men/1.jpg',
        isAdmin: true,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'john_doe',
        email: 'john@example.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'John',
        lastName: 'Doe',
        bio: 'Event enthusiast and community organizer',
        profileImage: 'https://randomuser.me/api/portraits/men/2.jpg',
        isAdmin: false,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'jane_smith',
        email: 'jane@example.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Jane',
        lastName: 'Smith',
        bio: 'Professional event planner with 5 years of experience',
        profileImage: 'https://randomuser.me/api/portraits/women/2.jpg',
        isAdmin: false,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Generate additional random users if needed
    const additionalUsers = [];
    if (count > defaultUsers.length) {
      const additionalCount = count - defaultUsers.length;
      
      for (let i = 0; i < additionalCount; i++) {
        const gender = faker.person.sexType();
        const firstName = faker.person.firstName(gender);
        const lastName = faker.person.lastName();
        const username = faker.internet.userName({ firstName, lastName }).toLowerCase();
        
        additionalUsers.push({
          username,
          email: faker.internet.email({ firstName, lastName }),
          password: await bcrypt.hash('password123', 10),
          firstName,
          lastName,
          bio: faker.lorem.sentence(),
          profileImage: faker.image.avatar(),
          isAdmin: false,
          isVerified: faker.datatype.boolean(0.8), // 80% chance of being verified
          createdAt: faker.date.past(),
          updatedAt: new Date()
        });
      }
    }
    
    // Combine default and additional users
    const users = [...defaultUsers, ...additionalUsers].slice(0, count);
    
    // Create users in database
    const createdUsers = await User.bulkCreate(users, { individualHooks: true });
    
    logger.info(`Seeded ${createdUsers.length} users`);
    return createdUsers;
  } catch (error) {
    logger.error(`Error seeding users: ${error.message}`);
    throw error;
  }
}