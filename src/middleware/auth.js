import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import db from '../db/connection.js';

// Middleware to verify Firebase token
const firebaseAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Find or create user in our database
    const userResult = await db.query(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [decodedToken.uid]
    );
    
    let user = userResult.rows[0];
    
    if (!user) {
      // If user doesn't exist in our database but is authenticated with Firebase
      // Create a new user record
      const newUserResult = await db.query(
        'INSERT INTO users (firebase_uid, email, display_name, role, photo_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [decodedToken.uid, decodedToken.email, decodedToken.name || 'User', 'user', decodedToken.picture]
      );
      
      user = newUserResult.rows[0];
      console.log(`Created new user from Firebase auth: ${user.id}`);
    }
    
    // Update last login
    await db.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );
    
    // Add user info to request
    req.user = {
      id: user.id,
      firebaseUid: user.firebase_uid,
      email: user.email,
      displayName: user.display_name,
      role: user.role
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Middleware to verify JWT (for non-Firebase auth)
const jwtAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user in database
    const userResult = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [decoded.id]
    );
    
    const user = userResult.rows[0];
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Update last login
    await db.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );
    
    // Add user info to request
    req.user = {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role
    };
    
    next();
  } catch (error) {
    console.error('JWT Authentication error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    
    next();
  };
};

// Choose which auth method to use based on environment or config
const auth = process.env.USE_JWT_AUTH === 'true' ? jwtAuth : firebaseAuth;

export default {
  auth,
  authorize,
  firebaseAuth,
  jwtAuth
};