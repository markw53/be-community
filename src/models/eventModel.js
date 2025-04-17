import db from '../db/connection.js';

class Event {
  // Find event by ID
  static async findById(id) {
    const result = await db.query(
      `SELECT e.*, 
              u.display_name as organiser_name, 
              u.photo_url as organiser_photo 
       FROM events e
       JOIN users u ON e.organiser_id = u.id
       WHERE e.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) return null;
    
    const event = result.rows[0];
    
    // Get attendees
    const attendeesResult = await db.query(
      `SELECT u.id, u.display_name, u.photo_url, ea.registered_at
       FROM users u
       JOIN event_attendees ea ON u.id = ea.user_id
       WHERE ea.event_id = $1`,
      [id]
    );
    
    event.attendees = attendeesResult.rows;
    
    return event;
  }
  
  // Create a new event
  static async create(eventData) {
    const { 
      title, 
      description, 
      startTime, 
      endTime, 
      location, 
      category = 'General', 
      imageUrl, 
      capacity = 0, 
      isPublished = true, 
      organiserId 
    } = eventData;
    
    const result = await db.query(
      `INSERT INTO events 
       (title, description, start_time, end_time, location, category, image_url, capacity, is_published, organiser_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [title, description, startTime, endTime, location, category, imageUrl, capacity, isPublished, organiserId]
    );
    
    return result.rows[0];
  }
  
  // Update event - THIS METHOD DECLARATION WAS MISSING
  static async update(id, eventData) {
    const { 
      title, 
      description, 
      startTime, 
      endTime, 
      location, 
      category, 
      imageUrl, 
      capacity, 
      isPublished, 
      isCancelled 
    } = eventData;
    
    // Update event
    const result = await db.query(
      `UPDATE events 
       SET title = COALESCE($1, title), 
           description = COALESCE($2, description), 
           start_time = COALESCE($3, start_time), 
           end_time = COALESCE($4, end_time), 
           location = COALESCE($5, location), 
           category = COALESCE($6, category), 
           image_url = COALESCE($7, image_url), 
           capacity = COALESCE($8, capacity), 
           is_published = COALESCE($9, is_published), 
           is_cancelled = COALESCE($10, is_cancelled),
           updated_at = NOW()
       WHERE id = $11 
       RETURNING *`,
      [title, description, startTime, endTime, location, category, imageUrl, capacity, isPublished, isCancelled, id]
    );
    
    return result.rows[0];
  }
  
  // Delete event
  static async delete(id) {
    const result = await db.query(
      'DELETE FROM events WHERE id = $1 RETURNING *',
      [id]
    );
    
    return result.rows[0];
  }
  
  // Get all events with filtering and pagination
  static async getAll(filters = {}, limit = 10, offset = 0) {
    const {
      category,
      search,
      startDate,
      endDate,
      isPublished = true,
      organiserId
    } = filters;
    
    // Build the WHERE clause
    let whereClause = 'WHERE e.is_published = $1';
    const queryParams = [isPublished];
    let paramCount = 1;
    
    if (category) {
      paramCount++;
      whereClause += ` AND e.category = $${paramCount}`;
      queryParams.push(category);
    }
    
    if (search) {
      paramCount++;
      whereClause += ` AND (e.title ILIKE $${paramCount} OR e.description ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }
    
    if (startDate) {
      paramCount++;
      whereClause += ` AND e.start_time >= $${paramCount}`;
      queryParams.push(startDate);
    }
    
    if (endDate) {
      paramCount++;
      whereClause += ` AND e.start_time <= $${paramCount}`;
      queryParams.push(endDate);
    }
    
    if (organiserId) {
      paramCount++;
      whereClause += ` AND e.organiser_id = $${paramCount}`;
      queryParams.push(organiserId);
    }
    
    // Add pagination parameters
    paramCount++;
    const limitParam = paramCount;
    queryParams.push(limit);
    
    paramCount++;
    const offsetParam = paramCount;
    queryParams.push(offset);
    
    // Execute the query
    const result = await db.query(
      `SELECT e.*, 
              u.display_name as organiser_name, 
              u.photo_url as organiser_photo,
              (SELECT COUNT(*) FROM event_attendees WHERE event_id = e.id) as attendee_count
       FROM events e
       JOIN users u ON e.organiser_id = u.id
       ${whereClause}
       ORDER BY e.start_time
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      queryParams
    );
    
    // Get total count for pagination
    const countResult = await db.query(
      `SELECT COUNT(*) 
       FROM events e
       ${whereClause}`,
      queryParams.slice(0, -2) // Remove limit and offset params
    );
    
    return {
      events: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset
    };
  }
  
  // Register user for an event
  static async registerUser(eventId, userId) {
    try {
      // Check if user is already registered
      const checkResult = await db.query(
        'SELECT * FROM event_attendees WHERE event_id = $1 AND user_id = $2',
        [eventId, userId]
      );
      
      if (checkResult.rows.length > 0) {
        return { success: false, message: 'User already registered for this event' };
      }
      
      // Check event capacity
      const eventResult = await db.query(
        'SELECT capacity FROM events WHERE id = $1',
        [eventId]
      );
      
      if (eventResult.rows.length === 0) {
        return { success: false, message: 'Event not found' };
      }
      
      const event = eventResult.rows[0];
      
      // Check current attendee count
      const countResult = await db.query(
        'SELECT COUNT(*) FROM event_attendees WHERE event_id = $1',
        [eventId]
      );
      
      const currentCount = parseInt(countResult.rows[0].count);
      
      // Check if event is at capacity
      if (event.capacity > 0 && currentCount >= event.capacity) {
        return { success: false, message: 'Event is at capacity' };
      }
      
      // Register user
      await db.query(
        'INSERT INTO event_attendees (event_id, user_id) VALUES ($1, $2)',
        [eventId, userId]
      );
      
      return { success: true, message: 'User registered successfully' };
    } catch (error) {
      console.error('Error registering user for event:', error);
      return { success: false, message: 'Failed to register for event' };
    }
  }
  
  // Unregister user from an event
  static async unregisterUser(eventId, userId) {
    try {
      const result = await db.query(
        'DELETE FROM event_attendees WHERE event_id = $1 AND user_id = $2 RETURNING *',
        [eventId, userId]
      );
      
      if (result.rows.length === 0) {
        return { success: false, message: 'User not registered for this event' };
      }
      
      return { success: true, message: 'User unregistered successfully' };
    } catch (error) {
      console.error('Error unregistering user from event:', error);
      return { success: false, message: 'Failed to unregister from event' };
    }
  }
  
  // Check if user is registered for an event
  static async isUserRegistered(eventId, userId) {
    const result = await db.query(
      'SELECT * FROM event_attendees WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );
    
    return result.rows.length > 0;
  }
  
  // Get event attendees
  static async getAttendees(eventId) {
    const result = await db.query(
      `SELECT u.id, u.display_name, u.photo_url, ea.registered_at
       FROM users u
       JOIN event_attendees ea ON u.id = ea.user_id
       WHERE ea.event_id = $1
       ORDER BY ea.registered_at`,
      [eventId]
    );
    
    return result.rows;
  }
}

export default Event;