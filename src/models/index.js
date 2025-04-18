// src/models/index.js
import User from './userModel.js';
import Event from './eventModel.js';
import Category from './categoryModel.js';
import Attendee from './attendeeModel.js';

// Define associations
Event.belongsTo(User, { as: 'organizer', foreignKey: 'organizerId' });
User.hasMany(Event, { as: 'organizedEvents', foreignKey: 'organizerId' });

Event.belongsToMany(Category, { through: 'EventCategories' });
Category.belongsToMany(Event, { through: 'EventCategories' });

Event.belongsToMany(User, { through: Attendee, as: 'attendees' });
User.belongsToMany(Event, { through: Attendee, as: 'attendedEvents' });

export {
  User,
  Event,
  Category,
  Attendee
};