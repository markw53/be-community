import db from '../db/connection.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

class Auth {
  // Register a new user
  static async register(userData) {
    try {
      const { email, password, displayName, role = 'user', photoUrl, bio } = userData;
      
      // Check if user already exists
      const existingUserResult = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      
      if (existingUserResult.rows.length > 0) {
        return { success: false, message: 'User already exists with this email' };
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const userResult = await db.query(
        `INSERT INTO users 
         (email, password, display_name, role, photo_url, bio) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [email, hashedPassword, displayName, role, photoUrl, bio]
      );
      
      const user = userResult.rows[0];
      
      // Generate token
      const token = this.generateToken(user);
      
      // Remove password from user object
      delete user.password;
      
      return {
        success: true,
        user,
        token
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Failed to register user' };
    }
  }
  
  // Login a user
  static async login(email, password) {
    try {
      // Find user by email
      const userResult = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      
      if (userResult.rows.length === 0) {
        return { success: false, message: 'Invalid credentials' };
      }
      
      const user = userResult.rows[0];
      
      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return { success: false, message: 'Invalid credentials' };
      }
      
      // Update last login
      await db.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );
      
      // Generate token
      const token = this.generateToken(user);
      
      // Remove password from user object
      delete user.password;
      
      return {
        success: true,
        user,
        token
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Failed to login' };
    }
  }
  
  // Process Firebase authentication
  static async processFirebaseAuth(firebaseUser) {
    try {
      const { uid, email, displayName, photoURL } = firebaseUser;
      
      // Find user by Firebase UID
      const userResult = await db.query(
        'SELECT * FROM users WHERE firebase_uid = $1',
        [uid]
      );
      
      let user;
      
      if (userResult.rows.length === 0) {
        // If user doesn't exist, create a new one
        const newUserResult = await db.query(
          `INSERT INTO users 
           (firebase_uid, email, display_name, role, photo_url) 
           VALUES ($1, $2, $3, $4, $5) 
           RETURNING *`,
          [uid, email, displayName || email.split('@')[0], 'user', photoURL]
        );
        
        user = newUserResult.rows[0];
      } else {
        user = userResult.rows[0];
        
        // Update last login
        await db.query(
          'UPDATE users SET last_login = NOW() WHERE id = $1',
          [user.id]
        );
      }
      
      // Generate token
      const token = this.generateToken(user);
      
      // Remove password from user object
      delete user.password;
      
      return {
        success: true,
        user,
        token
      };
    } catch (error) {
      console.error('Firebase auth processing error:', error);
      return { success: false, message: 'Failed to process Firebase authentication' };
    }
  }
  
  // Generate JWT token
  static generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
  }
  
  // Verify JWT token
  static async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user by ID
      const userResult = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [decoded.id]
      );
      
      if (userResult.rows.length === 0) {
        return { success: false, message: 'User not found' };
      }
      
      const user = userResult.rows[0];
      
      return {
        success: true,
        user
      };
    } catch (error) {
      console.error('Token verification error:', error);
      return { success: false, message: 'Invalid token' };
    }
  }
  
  // Reset password request
  static async requestPasswordReset(email) {
    try {
      // Find user by email
      const userResult = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      
      if (userResult.rows.length === 0) {
        return { success: false, message: 'User not found' };
      }
      
      const user = userResult.rows[0];
      
      // Generate reset token (valid for 1 hour)
      const resetToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      // In a real application, you would send an email with the reset link
      // For this example, we'll just return the token
      
      return {
        success: true,
        message: 'Password reset email sent',
        resetToken // In production, don't return this
      };
    } catch (error) {
      console.error('Password reset request error:', error);
      return { success: false, message: 'Failed to process password reset request' };
    }
  }
  
  // Reset password
  static async resetPassword(resetToken, newPassword) {
    try {
      // Verify reset token
      const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
      
      // Find user by ID
      const userResult = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [decoded.id]
      );
      
      if (userResult.rows.length === 0) {
        return { success: false, message: 'User not found' };
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      await db.query(
        'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
        [hashedPassword, decoded.id]
      );
      
      return {
        success: true,
        message: 'Password reset successful'
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, message: 'Invalid or expired reset token' };
    }
  }
}

export default Auth;