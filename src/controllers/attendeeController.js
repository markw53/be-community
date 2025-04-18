// src/controllers/attendeeController.js
import Attendee from '../database/models/Attendee.js';
import Event from '../database/models/Event.js';
import User from '../database/models/User.js';
import { sequelize } from '../database/config.js';
import logger from '../utils/logger.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors.js';
import { queueEmail } from '../jobs/queue.js';

/**
 * Get attendees for an event
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const getEventAttendees = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { status } = req.query;
    
    // Check if event exists
    const event = await Event.findByPk(eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }
    
    // Check if user is authorized to view attendees
    // Only event organizer or admin can see all attendees
    const isOrganizer = event.organizerId === req.user.id;
    const isAdmin = req.user.isAdmin;
    
    if (!isOrganizer && !isAdmin && !event.isPublic) {
      throw new ForbiddenError('You are not authorized to view attendees for this event');
    }
    
    // Build query
    const query = {
      where: { eventId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage']
        }
      ],
      order: [['createdAt', 'ASC']]
    };
    
    // Filter by status if provided
    if (status && ['pending', 'confirmed', 'declined', 'no-show'].includes(status)) {
      query.where.status = status;
    }
    
    const attendees = await Attendee.findAll(query);
    
    res.status(200).json({
      status: 'success',
      results: attendees.length,
      data: {
        attendees
      }
    });
  } catch (error) {
    logger.error(`Error getting event attendees: ${error.message}`);
    next(error);
  }
};

/**
 * Get events that a user is attending
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const getUserAttendance = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;
    
    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Check if user is authorized to view attendance
    // Users can only see their own attendance unless they're an admin
    if (userId !== req.user.id && !req.user.isAdmin) {
      throw new ForbiddenError('You are not authorized to view this user\'s attendance');
    }
    
    // Build query
    const query = {
      where: { userId },
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'title', 'description', 'startDate', 'endDate', 'location', 'image', 'organizerId'],
          include: [
            {
              model: User,
              as: 'organizer',
              attributes: ['id', 'username', 'firstName', 'lastName']
            }
          ]
        }
      ],
      order: [[sequelize.col('event.startDate'), 'ASC']]
    };
    
    // Filter by status if provided
    if (status && ['pending', 'confirmed', 'declined', 'no-show'].includes(status)) {
      query.where.status = status;
    }
    
    const attendance = await Attendee.findAll(query);
    
    res.status(200).json({
      status: 'success',
      results: attendance.length,
      data: {
        attendance
      }
    });
  } catch (error) {
    logger.error(`Error getting user attendance: ${error.message}`);
    next(error);
  }
};

/**
 * Register user for an event
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const registerForEvent = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { eventId } = req.params;
    const userId = req.user.id;
    
    // Check if event exists
    const event = await Event.findByPk(eventId, { transaction });
    if (!event) {
      throw new NotFoundError('Event not found');
    }
    
    // Check if event is in the past
    if (new Date(event.startDate) < new Date()) {
      throw new ValidationError('Cannot register for past events');
    }
    
    // Check if event is full
    const attendeeCount = await Attendee.count({
      where: { 
        eventId,
        status: 'confirmed'
      },
      transaction
    });
    
    if (event.maxAttendees && attendeeCount >= event.maxAttendees) {
      throw new ValidationError('Event is at full capacity');
    }
    
    // Check if user is already registered
    const existingAttendee = await Attendee.findOne({
      where: { userId, eventId },
      transaction
    });
    
    if (existingAttendee) {
      throw new ValidationError('You are already registered for this event');
    }
    
    // Create attendee record
    const attendee = await Attendee.create({
      userId,
      eventId,
      status: 'confirmed', // Auto-confirm for now, could be 'pending' if approval is needed
      notes: req.body.notes
    }, { transaction });
    
    await transaction.commit();
    
    // Send confirmation email
    const user = await User.findByPk(userId);
    if (user && user.email) {
      await queueEmail({
        to: user.email,
        subject: `Registration Confirmed: ${event.title}`,
        template: 'eventRegistration',
        context: {
          userName: user.firstName || user.username,
          eventTitle: event.title,
          eventDate: new Date(event.startDate).toLocaleDateString(),
          eventTime: new Date(event.startDate).toLocaleTimeString(),
          eventLocation: event.location
        }
      });
    }
    
    res.status(201).json({
      status: 'success',
      data: {
        attendee
      }
    });
  } catch (error) {
    await transaction.rollback();
    logger.error(`Error registering for event: ${error.message}`);
    next(error);
  }
};

/**
 * Update attendance status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const updateAttendanceStatus = async (req, res, next) => {
  try {
    const { attendeeId } = req.params;
    const { status, notes } = req.body;
    
    // Check if attendee record exists
    const attendee = await Attendee.findByPk(attendeeId, {
      include: [
        {
          model: Event,
          as: 'event'
        },
        {
          model: User,
          as: 'user'
        }
      ]
    });
    
    if (!attendee) {
      throw new NotFoundError('Attendance record not found');
    }
    
    // Check if user is authorized to update status
    // Only the attendee, event organizer, or admin can update status
    const isAttendee = attendee.userId === req.user.id;
    const isOrganizer = attendee.event.organizerId === req.user.id;
    const isAdmin = req.user.isAdmin;
    
    if (!isAttendee && !isOrganizer && !isAdmin) {
      throw new ForbiddenError('You are not authorized to update this attendance record');
    }
    
    // Attendees can only cancel their attendance, not change to other statuses
    if (isAttendee && !isOrganizer && !isAdmin && status !== 'declined') {
      throw new ForbiddenError('You can only cancel your attendance');
    }
    
    // Update attendee record
    await attendee.update({
      status,
      notes: notes !== undefined ? notes : attendee.notes,
      // Set checkedInAt if status is being changed to 'confirmed' by organizer or admin
      checkedInAt: (status === 'confirmed' && (isOrganizer || isAdmin) && !attendee.checkedInAt) 
        ? new Date() 
        : attendee.checkedInAt
    });
    
    // Send notification email if status changed
    if (attendee.user && attendee.user.email) {
      let emailSubject, emailTemplate;
      
      switch (status) {
        case 'confirmed':
          emailSubject = `Attendance Confirmed: ${attendee.event.title}`;
          emailTemplate = 'attendanceConfirmed';
          break;
        case 'declined':
          emailSubject = `Attendance Cancelled: ${attendee.event.title}`;
          emailTemplate = 'attendanceCancelled';
          break;
        default:
          // Don't send emails for other status changes
          break;
      }
      
      if (emailSubject && emailTemplate) {
        await queueEmail({
          to: attendee.user.email,
          subject: emailSubject,
          template: emailTemplate,
          context: {
            userName: attendee.user.firstName || attendee.user.username,
            eventTitle: attendee.event.title,
            eventDate: new Date(attendee.event.startDate).toLocaleDateString(),
            eventTime: new Date(attendee.event.startDate).toLocaleTimeString()
          }
        });
      }
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        attendee
      }
    });
  } catch (error) {
    logger.error(`Error updating attendance status: ${error.message}`);
    next(error);
  }
};

/**
 * Check in attendee
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const checkInAttendee = async (req, res, next) => {
  try {
    const { attendeeId } = req.params;
    
    // Check if attendee record exists
    const attendee = await Attendee.findByPk(attendeeId, {
      include: [
        {
          model: Event,
          as: 'event'
        },
        {
          model: User,
          as: 'user'
        }
      ]
    });
    
    if (!attendee) {
      throw new NotFoundError('Attendance record not found');
    }
    
    // Check if user is authorized to check in attendees
    // Only the event organizer or admin can check in attendees
    const isOrganizer = attendee.event.organizerId === req.user.id;
    const isAdmin = req.user.isAdmin;
    
    if (!isOrganizer && !isAdmin) {
      throw new ForbiddenError('You are not authorized to check in attendees');
    }
    
    // Update attendee record
    await attendee.update({
      status: 'confirmed',
      checkedInAt: new Date()
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        attendee
      }
    });
  } catch (error) {
    logger.error(`Error checking in attendee: ${error.message}`);
    next(error);
  }
};

/**
 * Delete attendance record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const deleteAttendance = async (req, res, next) => {
  try {
    const { attendeeId } = req.params;
    
    // Check if attendee record exists
    const attendee = await Attendee.findByPk(attendeeId, {
      include: [
        {
          model: Event,
          as: 'event'
        }
      ]
    });
    
    if (!attendee) {
      throw new NotFoundError('Attendance record not found');
    }
    
    // Check if user is authorized to delete attendance
    // Only the attendee, event organizer, or admin can delete attendance
    const isAttendee = attendee.userId === req.user.id;
    const isOrganizer = attendee.event.organizerId === req.user.id;
    const isAdmin = req.user.isAdmin;
    
    if (!isAttendee && !isOrganizer && !isAdmin) {
      throw new ForbiddenError('You are not authorized to delete this attendance record');
    }
    
    // Delete attendee record
    await attendee.destroy();
    
    res.status(204).send();
  } catch (error) {
    logger.error(`Error deleting attendance: ${error.message}`);
    next(error);
  }
};

export default {
  getEventAttendees,
  getUserAttendance,
  registerForEvent,
  updateAttendanceStatus,
  checkInAttendee,
  deleteAttendance
};