const Event = require('../models/eventModel');

// Get all events with filtering and pagination
const getAllEvents = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      search,
      startDate,
      endDate,
      published = true
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const filters = {
      category,
      search,
      startDate,
      endDate,
      isPublished: published === 'true' || published === true
    };
    
    const result = await Event.getAll(filters, parseInt(limit), offset);
    
    res.json({
      events: result.events,
      pagination: {
        total: result.total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(result.total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all events error:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
};

// Get event by ID
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // If user is authenticated, check if they're registered
    if (req.user) {
      event.isRegistered = await Event.isUserRegistered(event.id, req.user.id);
    }
    
    res.json(event);
  } catch (error) {
    console.error('Get event by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch event' });
  }
};

// Create new event
const createEvent = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      startTime, 
      endTime, 
      location, 
      category, 
      imageUrl, 
      capacity, 
      isPublished 
    } = req.body;
    
    const event = await Event.create({
      title,
      description,
      startTime,
      endTime,
      location,
      category,
      imageUrl,
      capacity,
      isPublished,
      organiserId: req.user.id // From auth middleware
    });
    
    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Failed to create event' });
  }
};

// Update event
const updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    
    // Check if event exists
    const existingEvent = await Event.findById(eventId);
    if (!existingEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is authorized to update this event
    if (existingEvent.organiser_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }
    
    const { 
      title, 
      description, 
      startTime, 
      endTime, 
      location, 
      category, 
      imageUrl, 
      capacity, 
      isPublished,
      isCancelled
    } = req.body;
    
    const updatedEvent = await Event.update(eventId, {
      title,
      description,
      startTime,
      endTime,
      location,
      category,
      imageUrl,
      capacity,
      isPublished,
      isCancelled
    });
    
    res.json(updatedEvent);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Failed to update event' });
  }
};

// Delete event
const deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    
    // Check if event exists
    const existingEvent = await Event.findById(eventId);
    if (!existingEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is authorized to delete this event
    if (existingEvent.organiser_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }
    
    await Event.delete(eventId);
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Failed to delete event' });
  }
};

// Register for an event
const registerForEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    
    const result = await Event.registerUser(eventId, userId);
    
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    
    res.json({ message: result.message });
  } catch (error) {
    console.error('Register for event error:', error);
    res.status(500).json({ message: 'Failed to register for event' });
  }
};

// Unregister from an event
const unregisterFromEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    
    const result = await Event.unregisterUser(eventId, userId);
    
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    
    res.json({ message: result.message });
  } catch (error) {
    console.error('Unregister from event error:', error);
    res.status(500).json({ message: 'Failed to unregister from event' });
  }
};

// Get event attendees
const getEventAttendees = async (req, res) => {
  try {
    const eventId = req.params.id;
    
    // Check if event exists
    const existingEvent = await Event.findById(eventId);
    if (!existingEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is authorized to view attendees
    if (existingEvent.organiser_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ message: 'Not authorized to view attendees' });
    }
    
    const attendees = await Event.getAttendees(eventId);
    
    res.json(attendees);
  } catch (error) {
    console.error('Get event attendees error:', error);
    res.status(500).json({ message: 'Failed to fetch attendees' });
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent,
  getEventAttendees
};