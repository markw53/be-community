const User = require('../models/userModel');

// Get user profile
const getUserProfile = async (req, res) => {
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
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Failed to get user profile' });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const { display_name, bio, photo_url } = req.body;
    
    const updatedUser = await User.update(req.user.id, {
      displayName: display_name,
      bio,
      photoUrl: photo_url
    });
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't send password
    delete updatedUser.password;
    
    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      displayName: updatedUser.display_name,
      role: updatedUser.role,
      photoUrl: updatedUser.photo_url,
      bio: updatedUser.bio,
      createdAt: updatedUser.created_at,
      updatedAt: updatedUser.updated_at
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ message: 'Failed to update user profile' });
  }
};

// Get user's events (organized and attending)
const getUserEvents = async (req, res) => {
  try {
    const organizedEvents = await User.getOrganizedEvents(req.user.id);
    const attendingEvents = await User.getAttendingEvents(req.user.id);
    
    res.json({
      organized: organizedEvents,
      attending: attendingEvents
    });
  } catch (error) {
    console.error('Get user events error:', error);
    res.status(500).json({ message: 'Failed to get user events' });
  }
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.getAll(parseInt(limit), offset);
    
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
};

// Get user by ID (admin only)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't send password
    delete user.password;
    
    res.json(user);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Failed to get user' });
  }
};

// Update user (admin only)
const updateUser = async (req, res) => {
  try {
    const { email, display_name, role, photo_url, bio } = req.body;
    
    const updatedUser = await User.update(req.params.id, {
      email,
      displayName: display_name,
      role,
      photoUrl: photo_url,
      bio
    });
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't send password
    delete updatedUser.password;
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.delete(req.params.id);
    
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserEvents,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};