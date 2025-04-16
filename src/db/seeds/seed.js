const format = require('pg-format');
const db = require('../connection');
const bcrypt = require('bcryptjs');

const seed = async ({ userData, eventData, attendeeData }) => {
  // Drop existing tables if they exist
  await db.query(`DROP TABLE IF EXISTS event_attendees;`);
  await db.query(`DROP TABLE IF EXISTS events;`);
  await db.query(`DROP TABLE IF EXISTS users;`);

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
    CREATE TABLE event_attendees (
      event_id UUID REFERENCES events(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      registered_at TIMESTAMP NOT NULL DEFAULT NOW(),
      PRIMARY KEY (event_id, user_id)
    );
  `);

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

  // Create indexes for performance
  await db.query(`CREATE INDEX idx_events_organiser ON events(organiser_id);`);
  await db.query(`CREATE INDEX idx_events_category ON events(category);`);
  await db.query(`CREATE INDEX idx_events_start_time ON events(start_time);`);
  await db.query(`CREATE INDEX idx_event_attendees_user ON event_attendees(user_id);`);

  // Hash passwords for users
  const hashedUserData = await Promise.all(
    userData.map(async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
      return user;
    })
  );

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
  
  // Create a lookup object to map email to user ID
  const userIdLookup = {};
  userRows.forEach(user => {
    userIdLookup[user.email] = user.id;
  });

  // Insert events
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
  
  // Create a lookup object to map event title to event ID
  const eventIdLookup = {};
  eventRows.forEach(event => {
    eventIdLookup[event.title] = event.id;
  });

  // Insert event attendees
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

    await db.query(insertAttendeesQueryStr);
  }

  return { userIdLookup, eventIdLookup };
};

module.exports = seed;