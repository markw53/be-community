import User from '../models/userModel.js';
import Event from '../models/eventModel.js';

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't send password
    delete user.password;
    
    // Only allow users to view their own profile unless admin
    if (req.user.id !== user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this profile' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Only allow users to update their own profile unless admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }
    
    const { displayName, bio, photoUrl } = req.body;
    
    const updatedUser = await User.update(userId, {
      displayName,
      bio,
      photoUrl
    });
    
    // Don't send password
    delete updatedUser.password;
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    await User.delete(userId);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// Get user's events (events they've registered for)
export const getUserEvents = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Only allow users to view their own events unless admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view these events' });
    }
    
    const events = await Event.getByAttendee(userId);
    
    res.json(events);
  } catch (error) {
    console.error('Get user events error:', error);
    res.status(500).json({ message: 'Failed to fetch user events' });
  }
};

// Also provide a default export for backward compatibility
export default {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserEvents
};