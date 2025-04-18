// src/database/seeds/attendeeSeeds.js
import { Attendee } from '../models/Attendee.js';
import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import logger from '../../utils/logger.js';
import { faker } from '@faker-js/faker';
import config from '../../../config/config.js';

// Set a consistent seed for reproducible data
faker.seed(config.db.seeding.randomSeed);

/**
 * Seed attendees into the database
 * @returns {Promise<Array>} Array of created attendees
 */
export async function seedAttendees() {
  try {
    // Get users and events
    const users = await User.findAll();
    const events = await Event.findAll();
    
    if (users.length === 0) {
      throw new Error('No users found. Please seed users first.');
    }
    
    if (events.length === 0) {
      throw new Error('No events found. Please seed events first.');
    }
    
    const attendees = [];
    const attendeeMap = new Map(); // To prevent duplicate attendees
    
    // For each event, add some attendees
    for (const event of events) {
      // Skip if the event is in the past
      const eventDate = new Date(event.startDate);
      const now = new Date();
      const isPastEvent = eventDate < now;
      
      // Determine how many attendees to add (between 0 and 80% of max)
      const maxPossibleAttendees = Math.min(
        event.maxAttendees,
        users.length
      );
      
      let numAttendees;
      if (isPastEvent) {
        // Past events have more attendees (40-80% of max)
        numAttendees = faker.number.int({
          min: Math.floor(maxPossibleAttendees * 0.4),
          max: Math.floor(maxPossibleAttendees * 0.8)
        });
      } else {
        // Future events have fewer attendees (0-50% of max)
        numAttendees = faker.number.int({
          min: 0,
          max: Math.floor(maxPossibleAttendees * 0.5)
        });
      }
      
      // Get random users as attendees
      const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
      const eventAttendees = shuffledUsers.slice(0, numAttendees);
      
      // Add attendees for this event
      for (const user of eventAttendees) {
        // Skip the organizer (they're already part of the event)
        if (user.id === event.organizerId) {
          continue;
        }
        
        // Create a unique key to prevent duplicates
        const key = `${event.id}-${user.id}`;
        if (!attendeeMap.has(key)) {
          attendeeMap.set(key, true);
          
          // Determine status based on event date
          let status;
          if (isPastEvent) {
            // Past events have mostly confirmed attendees
            status = faker.helpers.arrayElement(['confirmed', 'confirmed', 'confirmed', 'declined', 'no-show']);
          } else {
            // Future events have a mix of pending and confirmed
            status = faker.helpers.arrayElement(['pending', 'confirmed', 'confirmed', 'declined']);
          }
          
          attendees.push({
            userId: user.id,
            eventId: event.id,
            status,
            createdAt: faker.date.past(),
            updatedAt: new Date()
          });
        }
      }
    }
    
    // Create attendees in database
    const createdAttendees = await Attendee.bulkCreate(attendees);
    
    logger.info(`Seeded ${createdAttendees.length} attendees`);
    return createdAttendees;
  } catch (error) {
    logger.error(`Error seeding attendees: ${error.message}`);
    throw error;
  }
}