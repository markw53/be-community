// src/routes/imageRoutes.js
import express from 'express';
import * as imageController from '../controllers/imageController.js';
import auth from '../middleware/auth.js';
import multer from 'multer';

const router = express.Router();

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

/**
 * @swagger
 * /images/events:
 *   post:
 *     summary: Upload event image
 *     description: Upload an image for an event (requires authentication)
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *               - eventId
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload (max 5MB, image formats only)
 *               eventId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the event to associate with this image
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     imageUrl:
 *                       type: string
 *                       format: uri
 *                       description: URL of the uploaded image
 *                       example: https://example.com/uploads/events/image-123456.jpg
 *       400:
 *         description: Invalid request (missing file, wrong format, or file too large)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: User does not have permission to upload for this event
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/events', auth, upload.single('image'), imageController.uploadEventImage);

/**
 * @swagger
 * /images/profile:
 *   post:
 *     summary: Upload profile image
 *     description: Upload a profile image for the authenticated user
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload (max 5MB, image formats only)
 *     responses:
 *       200:
 *         description: Profile image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     imageUrl:
 *                       type: string
 *                       format: uri
 *                       description: URL of the uploaded profile image
 *                       example: https://example.com/uploads/profiles/profile-123456.jpg
 *                     user:
 *                       $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Invalid request (missing file, wrong format, or file too large)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/profile', auth, upload.single('image'), imageController.uploadProfileImage);

/**
 * @swagger
 * /images/{id}:
 *   delete:
 *     summary: Delete an image
 *     description: Delete an uploaded image (requires authentication and appropriate permissions)
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Image ID
 *     responses:
 *       204:
 *         description: Image deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: User does not have permission to delete this image
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id', auth, imageController.deleteImage);

/**
 * @swagger
 * /images/resize:
 *   get:
 *     summary: Resize an image
 *     description: Get a resized version of an existing image
 *     tags: [Images]
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *           format: uri
 *         description: Original image URL
 *       - in: query
 *         name: width
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 2000
 *         description: Desired width in pixels
 *       - in: query
 *         name: height
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 2000
 *         description: Desired height in pixels
 *       - in: query
 *         name: fit
 *         schema:
 *           type: string
 *           enum: [cover, contain, fill, inside, outside]
 *           default: cover
 *         description: Resizing strategy
 *     responses:
 *       200:
 *         description: Resized image
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Original image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/resize', imageController.resizeImage);

export default router;