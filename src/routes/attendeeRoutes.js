// src/routes/attendeeRoutes.js
import express from 'express';
import { 
  getEventAttendees, 
  getUserAttendance, 
  registerForEvent, 
  updateAttendanceStatus, 
  checkInAttendee, 
  deleteAttendance 
} from '../controllers/attendeeController.js';
import { authenticate, isEventOrganizer } from '../middleware/auth.js';
import { validateAttendeeCreate, validateAttendeeUpdate } from '../middleware/validation.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

/**
 * @swagger
 * /events/{eventId}/attendees:
 *   get:
 *     summary: Get attendees for an event
 *     description: Retrieve a list of attendees for a specific event
 *     tags: [Attendees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, declined, no-show]
 *         description: Filter by attendance status
 *     responses:
 *       200:
 *         description: A list of attendees
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                   example: 10
 *                 data:
 *                   type: object
 *                   properties:
 *                     attendees:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           userId:
 *                             type: string
 *                             format: uuid
 *                           eventId:
 *                             type: string
 *                             format: uuid
 *                           status:
 *                             type: string
 *                             enum: [pending, confirmed, declined, no-show]
 *                           checkedInAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           notes:
 *                             type: string
 *                             nullable: true
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                           user:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                               username:
 *                                 type: string
 *                               firstName:
 *                                 type: string
 *                               lastName:
 *                                 type: string
 *                               profileImage:
 *                                 type: string
 *                                 format: uri
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to view attendees for this event
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/events/:eventId/attendees', authenticate, getEventAttendees);

/**
 * @swagger
 * /users/{userId}/attendance:
 *   get:
 *     summary: Get events a user is attending
 *     description: Retrieve a list of events that a user is attending
 *     tags: [Attendees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, declined, no-show]
 *         description: Filter by attendance status
 *     responses:
 *       200:
 *         description: A list of events the user is attending
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: object
 *                   properties:
 *                     attendance:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           userId:
 *                             type: string
 *                             format: uuid
 *                           eventId:
 *                             type: string
 *                             format: uuid
 *                           status:
 *                             type: string
 *                             enum: [pending, confirmed, declined, no-show]
 *                           checkedInAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           notes:
 *                             type: string
 *                             nullable: true
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                           event:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                               title:
 *                                 type: string
 *                               description:
 *                                 type: string
 *                               startDate:
 *                                 type: string
 *                                 format: date-time
 *                               endDate:
 *                                 type: string
 *                                 format: date-time
 *                               location:
 *                                 type: string
 *                               image:
 *                                 type: string
 *                                 format: uri
 *                               organizer:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: string
 *                                     format: uuid
 *                                   username:
 *                                     type: string
 *                                   firstName:
 *                                     type: string
 *                                   lastName:
 *                                     type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to view this user's attendance
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/users/:userId/attendance', authenticate, cacheMiddleware(300), getUserAttendance);

/**
 * @swagger
 * /events/{eventId}/register:
 *   post:
 *     summary: Register for an event
 *     description: Register the authenticated user for an event
 *     tags: [Attendees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Optional notes for the registration
 *     responses:
 *       201:
 *         description: Successfully registered for the event
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
 *                     attendee:
 *                       $ref: '#/components/schemas/Attendee'
 *       400:
 *         description: Validation error (e.g., already registered, event full)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/events/:eventId/register', authenticate, validateAttendeeCreate, registerForEvent);

/**
 * @swagger
 * /attendees/{attendeeId}:
 *   put:
 *     summary: Update attendance status
 *     description: Update the status of an attendance record
 *     tags: [Attendees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attendeeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Attendee record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, declined, no-show]
 *                 description: New attendance status
 *               notes:
 *                 type: string
 *                 description: Optional notes about the attendance
 *     responses:
 *       200:
 *         description: Attendance status updated successfully
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
 *                     attendee:
 *                       $ref: '#/components/schemas/Attendee'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to update this attendance record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/attendees/:attendeeId', authenticate, validateAttendeeUpdate, updateAttendanceStatus);

/**
 * @swagger
 * /attendees/{attendeeId}/check-in:
 *   post:
 *     summary: Check in an attendee
 *     description: Mark an attendee as checked in at the event (organizer or admin only)
 *     tags: [Attendees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attendeeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Attendee record ID
 *     responses:
 *       200:
 *         description: Attendee checked in successfully
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
 *                     attendee:
 *                       $ref: '#/components/schemas/Attendee'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to check in attendees
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/attendees/:attendeeId/check-in', authenticate, checkInAttendee);

/**
 * @swagger
 * /attendees/{attendeeId}:
 *   delete:
 *     summary: Delete attendance record
 *     description: Remove an attendance record (user can delete their own, organizer/admin can delete any)
 *     tags: [Attendees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attendeeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Attendee record ID
 *     responses:
 *       204:
 *         description: Attendance record deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to delete this attendance record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/attendees/:attendeeId', authenticate, deleteAttendance);

export default router;