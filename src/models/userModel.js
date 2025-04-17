import db from '../db/connection.js';
import bcrypt from 'bcryptjs';

class User {
  // Find user by ID
  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }
  
  // Find user by email
  static async findByEmail(email) {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }
  
  // Find user by Firebase UID
  static async findByFirebaseUid(firebaseUid) {
    const result = await db.query(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [firebaseUid]
    );
    return result.rows[0];
  }
  
  // Create a new user
  static async create(userData) {
    const { email, password, displayName, role = 'user', photoUrl, bio, firebaseUid } = userData;
    
    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    
    const result = await db.query(
      `INSERT INTO users 
       (email, password, display_name, role, photo_url, bio, firebase_uid) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [email, hashedPassword, displayName, role, photoUrl, bio, firebaseUid]
    );
    
    return result.rows[0];
  }
  
  // Update user
  static async update(id, userData) {
    const { email, displayName, role, photoUrl, bio } = userData;
    
    const result = await db.query(
      `UPDATE users 
       SET email = COALESCE($1, email), 
           display_name = COALESCE($2, display_name), 
           role = COALESCE($3, role), 
           photo_url = COALESCE($4, photo_url), 
           bio = COALESCE($5, bio),
           updated_at = NOW()
       WHERE id = $6 
       RETURNING *`,
      [email, displayName, role, photoUrl, bio, id]
    );
    
    return result.rows[0];
  }
  
  // Update password
  static async updatePassword(id, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await db.query(
      `UPDATE users 
       SET password = $1, 
           updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [hashedPassword, id]
    );
    
    return result.rows[0];
  }
  
  // Delete user
  static async delete(id) {
    const result = await db.query(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [id]
    );
    
    return result.rows[0];
  }
  
  // Get all users
  static async getAll(limit = 100, offset = 0) {
    const result = await db.query(
      `SELECT id, email, display_name, role, photo_url, bio, created_at, updated_at 
       FROM users 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    return result.rows;
  }
  
  // Check password
  static async checkPassword(user, password) {
    if (!user || !user.password) return false;
    return await bcrypt.compare(password, user.password);
  }
  
  // Get user's organized events
  static async getOrganizedEvents(userId) {
    const result = await db.query(
      `SELECT * FROM events 
       WHERE organiser_id = $1 
       ORDER BY start_time`,
      [userId]
    );
    
    return result.rows;
  }
  
  // Get user's attending events
  static async getAttendingEvents(userId) {
    const result = await db.query(
      `SELECT e.* 
       FROM events e
       JOIN event_attendees ea ON e.id = ea.event_id
       WHERE ea.user_id = $1
       ORDER BY e.start_time`,
      [userId]
    );
    
    return result.rows;
  }
}

export default User;