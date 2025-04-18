// src/routes/eventRoutes.js
import express from 'express';
import * as eventController from '../controllers/eventController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Get all events
 *     description: Retrieve a list of all events with optional filtering
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of events per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for event title or description
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter events starting on or after this date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter events ending on or before this date (YYYY-MM-DD)
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location (partial match)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [date, title, popularity]
 *           default: date
 *         description: Sort events by date, title, or popularity
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order (ascending or descending)
 *     responses:
 *       200:
 *         description: A list of events
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
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     totalResults:
 *                       type: integer
 *                       example: 47
 *                 data:
 *                   type: object
 *                   properties:
 *                     events:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/EventResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', eventController.getAllEvents);

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Get event by ID
 *     description: Retrieve detailed information about a specific event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Detailed event information
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
 *                     event:
 *                       $ref: '#/components/schemas/EventResponse'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', eventController.getEventById);

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create a new event
 *     description: Create a new event (authenticated, staff or admin only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - startDate
 *               - endDate
 *               - location
 *               - categoryId
 *             properties:
 *               title:
 *                 type: string
 *                 description: Event title
 *                 example: Tech Meetup 2023
 *               description:
 *                 type: string
 *                 description: Event description
 *                 example: Join us for an evening of tech talks and networking
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Event start date and time
 *                 example: 2023-12-15T18:00:00Z
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Event end date and time
 *                 example: 2023-12-15T21:00:00Z
 *               location:
 *                 type: string
 *                 description: Event location (address)
 *                 example: Tech Hub, 123 Innovation St
 *               locationLat:
 *                 type: number
 *                 format: float
 *                 description: Event location latitude
 *                 example: 37.7749
 *               locationLng:
 *                 type: number
 *                 format: float
 *                 description: Event location longitude
 *                 example: -122.4194
 *               maxAttendees:
 *                 type: integer
 *                 description: Maximum number of attendees
 *                 example: 100
 *               isPublic:
 *                 type: boolean
 *                 description: Whether the event is public
 *                 example: true
 *               image:
 *                 type: string
 *                 format: uri
 *                 description: URL to event image
 *                 example: https://example.com/images/event.jpg
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the event category
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       201:
 *         description: Event created successfully
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
 *                     event:
 *                       $ref: '#/components/schemas/EventResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: User does not have permission to create events
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/', auth, authorize('staff', 'admin'), eventController.createEvent);

/**
 * @swagger
 * /events/{id}:
 *   put:
 *     summary: Update an event
 *     description: Update an existing event (authenticated, owner or admin only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Event title
 *               description:
 *                 type: string
 *                 description: Event description
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Event start date and time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Event end date and time
 *               location:
 *                 type: string
 *                 description: Event location (address)
 *               locationLat:
 *                 type: number
 *                 format: float
 *                 description: Event location latitude
 *               locationLng:
 *                 type: number
 *                 format: float
 *                 description: Event location longitude
 *               maxAttendees:
 *                 type: integer
 *                 description: Maximum number of attendees
 *               isPublic:
 *                 type: boolean
 *                 description: Whether the event is public
 *               image:
 *                 type: string
 *                 format: uri
 *                 description: URL to event image
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the event category
 *     responses:
 *       200:
 *         description: Event updated successfully
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
 *                     event:
 *                       $ref: '#/components/schemas/EventResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: User does not have permission to update this event
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/:id', auth, eventController.updateEvent);

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Delete an event
 *     description: Delete an existing event (authenticated, owner or admin only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID
 *     responses:
 *       204:
 *         description: Event deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: User does not have permission to delete this event
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id', auth, eventController.deleteEvent);

/**
 * @swagger
 * /events/{id}/register:
 *   post:
 *     summary: Register for an event
 *     description: Register the authenticated user for an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
router.post('/:id/register', auth, eventController.registerForEvent);

/**
 * @swagger
 * /events/{id}/register:
 *   delete:
 *     summary: Unregister from an event
 *     description: Cancel the authenticated user's registration for an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Successfully unregistered from the event
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Successfully unregistered from the event
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Event not found or user not registered for this event
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id/register', auth, eventController.unregisterFromEvent);

/**
 * @swagger
 * /events/{id}/attendees:
 *   get:
 *     summary: Get event attendees
 *     description: Retrieve a list of attendees for a specific event (authenticated, owner or admin only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *         description: A list of event attendees
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
 *                   example: 25
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
 *         description: User does not have permission to view attendees for this event
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id/attendees', auth, eventController.getEventAttendees);

export default router;