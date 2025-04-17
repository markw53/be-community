import express from 'express';
import * as eventController from '../controllers/eventController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all events (public)
router.get('/', eventController.getAllEvents);

// Get event by ID (public)
router.get('/:id', eventController.getEventById);

// Create new event (authenticated, staff or admin only)
router.post('/', auth, authorize('staff', 'admin'), eventController.createEvent);

// Update event (authenticated, owner or admin only)
router.put('/:id', auth, eventController.updateEvent);

// Delete event (authenticated, owner or admin only)
router.delete('/:id', auth, eventController.deleteEvent);

// Register for an event (authenticated)
router.post('/:id/register', auth, eventController.registerForEvent);

// Unregister from an event (authenticated)
router.delete('/:id/register', auth, eventController.unregisterFromEvent);

// Get event attendees (authenticated, owner or admin only)
router.get('/:id/attendees', auth, eventController.getEventAttendees);

export default router;