-- Drop database if it exists and create a new one
DROP DATABASE IF EXISTS community_events;
CREATE DATABASE community_events;

-- Connect to the new database
-- Connect to the new database
-- Use the following command in psql instead: \c community_events

-- Create users table
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

-- Create events table
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

-- Create event_attendees junction table
CREATE TABLE event_attendees (
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    registered_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (event_id, user_id)
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_users_timestamp
AFTER UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_events_timestamp
AFTER UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Create indexes for performance
CREATE INDEX idx_events_organiser ON events(organiser_id);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_event_attendees_user ON event_attendees(user_id);

-- Insert sample admin user (password: admin123)
INSERT INTO users (email, password, display_name, role)
VALUES ('admin@example.com', '$2a$10$JqWvz7/mK6oJGd/3XTuVJeP1o2K9DWNbpJB7nLWk6.7wVJrIYyzIC', 'Admin User', 'admin');

-- Insert sample staff user (password: staff123)
INSERT INTO users (email, password, display_name, role)
VALUES ('staff@example.com', '$2a$10$JqWvz7/mK6oJGd/3XTuVJeP1o2K9DWNbpJB7nLWk6.7wVJrIYyzIC', 'Staff User', 'staff');

-- Insert sample regular user (password: user123)
INSERT INTO users (email, password, display_name, role)
VALUES ('user@example.com', '$2a$10$JqWvz7/mK6oJGd/3XTuVJeP1o2K9DWNbpJB7nLWk6.7wVJrIYyzIC', 'Regular User', 'user');

-- Insert sample events
INSERT INTO events (title, description, start_time, end_time, location, category, capacity, organiser_id)
VALUES 
('Community Cleanup', 'Join us for a day of cleaning up the local park.', '2023-12-15 09:00:00', '2023-12-15 12:00:00', 'Central Park', 'Environment', 50, (SELECT id FROM users WHERE email = 'staff@example.com')),
('Tech Workshop', 'Learn the basics of web development.', '2023-12-20 14:00:00', '2023-12-20 16:00:00', 'Community Center', 'Education', 30, (SELECT id FROM users WHERE email = 'staff@example.com')),
('Charity Run', 'Annual 5K run to raise funds for the local shelter.', '2023-12-25 08:00:00', '2023-12-25 11:00:00', 'Downtown', 'Charity', 100, (SELECT id FROM users WHERE email = 'staff@example.com'));

-- Register some users for events
INSERT INTO event_attendees (event_id, user_id)
VALUES 
((SELECT id FROM events WHERE title = 'Community Cleanup'), (SELECT id FROM users WHERE email = 'user@example.com')),
((SELECT id FROM events WHERE title = 'Tech Workshop'), (SELECT id FROM users WHERE email = 'user@example.com'));

-- Grant privileges
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;