const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const User = require('../models/userModel');
const Event = require('../models/eventModel');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
const eventImagesDir = path.join(uploadsDir, 'events');
const profileImagesDir = path.join(uploadsDir, 'profiles');

const ensureDirectoriesExist = async () => {
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(eventImagesDir, { recursive: true });
    await fs.mkdir(profileImagesDir, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directories:', error);
  }
};

ensureDirectoriesExist();

// Upload event image
const uploadEventImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    
    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({ message: 'Invalid file type. Only JPG, PNG, and GIF are allowed' });
    }
    
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(eventImagesDir, fileName);
    
    await fs.writeFile(filePath, req.file.buffer);
    
    // Create a URL for the image
    const imageUrl = `/uploads/events/${fileName}`;
    
    res.status(201).json({ imageUrl });
  } catch (error) {
    console.error('Upload event image error:', error);
    res.status(500).json({ message: 'Failed to upload image' });
  }
};

// Upload profile image
const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    
    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({ message: 'Invalid file type. Only JPG, PNG, and GIF are allowed' });
    }
    
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(profileImagesDir, fileName);
    
    await fs.writeFile(filePath, req.file.buffer);
    
    // Create a URL for the image
    const imageUrl = `/uploads/profiles/${fileName}`;
    
    // Update user's profile photo URL
    await User.update(req.user.id, { photoUrl: imageUrl });
    
    res.status(201).json({ imageUrl });
  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({ message: 'Failed to upload image' });
  }
};

module.exports = {
  uploadEventImage,
  uploadProfileImage
};