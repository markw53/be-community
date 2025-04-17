const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const { auth } = require('../middleware/auth');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload event image
router.post('/events', auth, upload.single('image'), imageController.uploadEventImage);

// Upload profile image
router.post('/profile', auth, upload.single('image'), imageController.uploadProfileImage);

module.exports = router;