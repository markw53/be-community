import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Assuming you have a User model for database operations

// Register a new user (non-Firebase)
const register = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }
    
    // Create new user
    const user = await User.create({
      email,
      password,
      displayName,
      role: 'user'
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
    
    // Return user data (excluding password)
    delete user.password;
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Failed to register user' });
  }
};

// Login user (non-Firebase)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isPasswordValid = await User.checkPassword(user, password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Update last login
    await User.update(user.id, { lastLogin: new Date() });
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
    
    // Return user data (excluding password)
    delete user.password;
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Failed to login' });
  }
};

// Get current user profile
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't send password
    delete user.password;
    
    res.json({
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
      photoUrl: user.photo_url,
      bio: user.bio,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Failed to get user profile' });
  }
};

// Process Firebase user login/registration
const processFirebaseAuth = async (req, res) => {
  try {
    // User is already authenticated and added to req.user by the auth middleware
    const { id, email, displayName, role } = req.user;
    
    // Generate a JWT token (optional, as you're using Firebase tokens)
    const token = jwt.sign(
      { id, email, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
    
    res.json({
      message: 'Firebase authentication successful',
      user: {
        id,
        email,
        displayName,
        role
      },
      token // Optional if you want to use your own JWT
    });
  } catch (error) {
    console.error('Firebase auth processing error:', error);
    res.status(500).json({ message: 'Failed to process authentication' });
  }
};

export default {
  register,
  login,
  getCurrentUser,
  processFirebaseAuth
};