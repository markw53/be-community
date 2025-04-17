import format from 'pg-format';
import db from '../connection.js'; 
import bcrypt from 'bcryptjs';

/**
 * Seeds the database with initial data
 * @param {Object} data - The data to seed
 * @param {Array} data.userData - Array of user objects
 * @param {Array} data.eventData - Array of event objects
 * @param {Array} data.attendeeData - Array of event attendee objects
 * @returns {Object} - Lookup tables for user IDs and event IDs
 */
const seed = async ({ userData, eventData, attendeeData }) => {
  // Validate database connection
  if (!db || typeof db.query !== 'function') {
    throw new Error('Invalid database connection provided');
  }

  // Validate required data
  if (!Array.isArray(userData) || userData.length === 0) {
    throw new Error('User data is required and must be an array');
  }

  // Validate user data
  userData.forEach((user, index) => {
    if (!user.email || !user.display_name) {
      throw new Error(`User at index ${index} is missing required fields (email or display_name)`);
    }
  });

  // Validate event data if provided
  if (eventData) {
    if (!Array.isArray(eventData)) {
      throw new Error('Event data must be an array');
    }

    eventData.forEach((event, index) => {
      if (!event.title || !event.description || !event.start_time || !event.end_time || !event.location || !event.organiser_email) {
        throw new Error(`Event at index ${index} is missing required fields`);
      }
      
      // Verify organiser email exists in userData
      const organiserExists = userData.some(user => user.email === event.organiser_email);
      if (!organiserExists) {
        throw new Error(`Event at index ${index} references non-existent organiser email: ${event.organiser_email}`);
      }
    });
  }

  // Validate attendee data if provided
  if (attendeeData) {
    if (!Array.isArray(attendeeData)) {
      throw new Error('Attendee data must be an array');
    }

    attendeeData.forEach((attendee, index) => {
      if (!attendee.event_title || !attendee.attendee_email) {
        throw new Error(`Attendee at index ${index} is missing required fields`);
      }
      
      // Verify attendee email exists in userData
      const attendeeExists = userData.some(user => user.email === attendee.attendee_email);
      if (!attendeeExists) {
        throw new Error(`Attendee at index ${index} references non-existent attendee email: ${attendee.attendee_email}`);
      }
      
      // Verify event title exists in eventData
      if (eventData) {
        const eventExists = eventData.some(event => event.title === attendee.event_title);
        if (!eventExists) {
          throw new Error(`Attendee at index ${index} references non-existent event title: ${attendee.event_title}`);
        }
      }
    });
  }

  try {
    // Start transaction
    await db.query('BEGIN');

    // Drop existing tables if they exist
    await db.query(`DROP TABLE IF EXISTS event_attendees;`);
    await db.query(`DROP TABLE IF EXISTS events;`);
    await db.query(`DROP TABLE IF EXISTS images;`);
    await db.query(`DROP TABLE IF EXISTS users;`);

    console.log('Dropped existing tables');

    // Create tables
    await db.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        firebase_uid VARCHAR(255) UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255),
        display_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        photo_url TEXT,
        bio TEXT,
        last_login TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await db.query(`
      CREATE TABLE events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        location VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT 'General',
        image_url TEXT,
        capacity INTEGER DEFAULT 0,
        is_published BOOLEAN DEFAULT TRUE,
        is_cancelled BOOLEAN DEFAULT FALSE,
        organiser_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await db.query(`
      CREATE TABLE images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        size INTEGER NOT NULL,
        path TEXT NOT NULL,
        url_path TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        width INTEGER,
        height INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await db.query(`
      CREATE TABLE event_attendees (
        event_id UUID REFERENCES events(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        registered_at TIMESTAMP NOT NULL DEFAULT NOW(),
        PRIMARY KEY (event_id, user_id)
      );
    `);

    console.log('Created database tables');

    // Create function and triggers for timestamp updates
    await db.query(`
      CREATE OR REPLACE FUNCTION update_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await db.query(`
      CREATE TRIGGER update_users_timestamp
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_timestamp();
    `);

    await db.query(`
      CREATE TRIGGER update_events_timestamp
      BEFORE UPDATE ON events
      FOR EACH ROW EXECUTE FUNCTION update_timestamp();
    `);

    await db.query(`
      CREATE TRIGGER update_images_timestamp
      BEFORE UPDATE ON images
      FOR EACH ROW EXECUTE FUNCTION update_timestamp();
    `);
    
    console.log('Created triggers for timestamp updates');

    // Create indexes for performance
    await db.query(`CREATE INDEX idx_events_organiser ON events(organiser_id);`);
    await db.query(`CREATE INDEX idx_events_category ON events(category);`);
    await db.query(`CREATE INDEX idx_events_start_time ON events(start_time);`);
    await db.query(`CREATE INDEX idx_event_attendees_user ON event_attendees(user_id);`);

    console.log('Created indexes for performance optimization');

    // Hash passwords for users
    const hashedUserData = await Promise.all(
      userData.map(async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
        return user;
      })
    );

    console.log('Hashed user passwords');

    // Insert users
    const insertUsersQueryStr = format(
      `INSERT INTO users 
       (email, password, display_name, role, photo_url, bio) 
       VALUES %L RETURNING id, email;`,
      hashedUserData.map(({ email, password, display_name, role, photo_url, bio }) => [
        email,
        password,
        display_name,
        role || 'user',
        photo_url || null,
        bio || null
      ])
    );

    const { rows: userRows } = await db.query(insertUsersQueryStr);
    console.log(`Inserted ${userRows.length} users`);
    
    // Create a lookup object to map email to user ID
    const userIdLookup = {};
    userRows.forEach(user => {
      userIdLookup[user.email] = user.id;
    });

    let eventIdLookup = {};

    // Insert events if provided
    if (eventData && eventData.length > 0) {
      const insertEventsQueryStr = format(
        `INSERT INTO events 
         (title, description, start_time, end_time, location, category, image_url, capacity, is_published, organiser_id) 
         VALUES %L RETURNING id, title;`,
        eventData.map(({ 
          title, 
          description, 
          start_time, 
          end_time, 
          location, 
          category, 
          image_url, 
          capacity, 
          is_published, 
          organiser_email 
        }) => [
          title,
          description,
          start_time,
          end_time,
          location,
          category || 'General',
          image_url || null,
          capacity || 0,
          is_published !== undefined ? is_published : true,
          userIdLookup[organiser_email] // Use the lookup to get the organiser ID
        ])
      );

      const { rows: eventRows } = await db.query(insertEventsQueryStr);
      console.log(`Inserted ${eventRows.length} events`);
      
      // Create a lookup object to map event title to event ID
      eventRows.forEach(event => {
        eventIdLookup[event.title] = event.id;
      });

      // Insert event attendees if provided
      if (attendeeData && attendeeData.length > 0) {
        const insertAttendeesQueryStr = format(
          `INSERT INTO event_attendees 
           (event_id, user_id) 
           VALUES %L;`,
          attendeeData.map(({ event_title, attendee_email }) => [
            eventIdLookup[event_title], // Use the lookup to get the event ID
            userIdLookup[attendee_email] // Use the lookup to get the user ID
          ])
        );

        const result = await db.query(insertAttendeesQueryStr);
        console.log(`Inserted ${result.rowCount} event attendees`);
      }
    }

    // Commit the transaction
    await db.query('COMMIT');
    console.log('Database seeding completed successfully');

    return { userIdLookup, eventIdLookup };
  } catch (error) {
    // Rollback the transaction in case of error
    await db.query('ROLLBACK');
    console.error('Error seeding database:', error);
    throw error;
  }
};

module.exports = seed;