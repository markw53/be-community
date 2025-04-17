const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const db = require('../config/connection');

// Define upload directories
const uploadsDir = path.join(__dirname, '../../uploads');
const eventImagesDir = path.join(uploadsDir, 'events');
const profileImagesDir = path.join(uploadsDir, 'profiles');

class Image {
  // Ensure upload directories exist
  static async ensureDirectoriesExist() {
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
      await fs.mkdir(eventImagesDir, { recursive: true });
      await fs.mkdir(profileImagesDir, { recursive: true });
      return true;
    } catch (error) {
      console.error('Error creating upload directories:', error);
      return false;
    }
  }
  
  // Save image file
  static async saveImage(file, type) {
    try {
      // Ensure directories exist
      await this.ensureDirectoriesExist();
      
      // Validate file type
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
      
      if (!allowedExtensions.includes(fileExtension)) {
        return {
          success: false,
          message: 'Invalid file type. Only JPG, PNG, and GIF are allowed'
        };
      }
      
      // Generate unique filename
      const fileName = `${uuidv4()}${fileExtension}`;
      
      // Determine directory based on type
      const directory = type === 'event' ? eventImagesDir : profileImagesDir;
      const filePath = path.join(directory, fileName);
      
      // Write file to disk
      await fs.writeFile(filePath, file.buffer);
      
      // Create URL path
      const urlPath = `/uploads/${type === 'event' ? 'events' : 'profiles'}/${fileName}`;
      
      return {
        success: true,
        fileName,
        filePath,
        imageUrl: urlPath
      };
    } catch (error) {
      console.error('Error saving image:', error);
      return {
        success: false,
        message: 'Failed to save image'
      };
    }
  }
  
  // Delete image
  static async deleteImage(filePath) {
    try {
      // Check if file exists
      await fs.access(filePath);
      
      // Delete file
      await fs.unlink(filePath);
      
      return {
        success: true,
        message: 'Image deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting image:', error);
      return {
        success: false,
        message: 'Failed to delete image'
      };
    }
  }
  
  // Get image dimensions (requires sharp package)
  static async getImageDimensions(filePath) {
    try {
      // This would require the sharp package
      // const sharp = require('sharp');
      // const metadata = await sharp(filePath).metadata();
      // return {
      //   width: metadata.width,
      //   height: metadata.height
      // };
      
      // For now, return placeholder dimensions
      return {
        width: 800,
        height: 600
      };
    } catch (error) {
      console.error('Error getting image dimensions:', error);
      return null;
    }
  }
  
  // Resize image (requires sharp package)
  static async resizeImage(filePath, width, height) {
    try {
      // This would require the sharp package
      // const sharp = require('sharp');
      // const resizedImageBuffer = await sharp(filePath)
      //   .resize(width, height)
      //   .toBuffer();
      // return resizedImageBuffer;
      
      // For now, just return the original file
      return await fs.readFile(filePath);
    } catch (error) {
      console.error('Error resizing image:', error);
      return null;
    }
  }
  
  // Generate thumbnail
  static async generateThumbnail(filePath, fileName, type) {
    try {
      // This would require the sharp package
      // const sharp = require('sharp');
      // const thumbnailDir = path.join(uploadsDir, 'thumbnails');
      // await fs.mkdir(thumbnailDir, { recursive: true });
      
      // const thumbnailPath = path.join(thumbnailDir, `thumb_${fileName}`);
      // await sharp(filePath)
      //   .resize(200, 200, { fit: 'inside' })
      //   .toFile(thumbnailPath);
      
      // return `/uploads/thumbnails/thumb_${fileName}`;
      
      // For now, just return the original URL
      return `/uploads/${type === 'event' ? 'events' : 'profiles'}/${fileName}`;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return null;
    }
  }
}

module.exports = Image;