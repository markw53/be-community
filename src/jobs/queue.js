import Bull from 'bull';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../../src/config/config.js';
import logger from '../utils/logger.js';

// Get directory name in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Queue configuration
const redisConfig = config.redis.enabled ? {
  redis: {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    tls: config.redis.tls ? {} : undefined
  }
} : {};

// Create queues
const emailQueue = new Bull('email-notifications', redisConfig);
const eventReminderQueue = new Bull('event-reminders', redisConfig);
const imageProcessingQueue = new Bull('image-processing', redisConfig);

// Configure queues
const queues = [emailQueue, eventReminderQueue, imageProcessingQueue];

// Set up queue event handlers
queues.forEach(queue => {
  queue.on('error', (error) => {
    logger.error(`Queue ${queue.name} error:`, error);
  });

  queue.on('failed', (job, error) => {
    logger.error(`Job ${job.id} in queue ${queue.name} failed:`, error);
  });

  if (config.env === 'development') {
    queue.on('completed', (job) => {
      logger.debug(`Job ${job.id} in queue ${queue.name} completed`);
    });
  }
});

/**
 * Add a job to the email queue
 * @param {Object} data - Email data (to, subject, template, context)
 * @param {Object} options - Bull job options
 * @returns {Promise<Job>} The created job
 */
export const queueEmail = async (data, options = {}) => {
  return emailQueue.add(data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60 * 1000 // 1 minute
    },
    removeOnComplete: true,
    ...options
  });
};

/**
 * Add a job to the event reminder queue
 * @param {Object} data - Reminder data (eventId, userId, reminderTime)
 * @param {Object} options - Bull job options
 * @returns {Promise<Job>} The created job
 */
export const queueEventReminder = async (data, options = {}) => {
  return eventReminderQueue.add(data, {
    delay: data.delay || 0,
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 5 * 60 * 1000 // 5 minutes
    },
    removeOnComplete: true,
    ...options
  });
};

/**
 * Add a job to the image processing queue
 * @param {Object} data - Image data (filePath, operations)
 * @param {Object} options - Bull job options
 * @returns {Promise<Job>} The created job
 */
export const queueImageProcessing = async (data, options = {}) => {
  return imageProcessingQueue.add(data, {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 30 * 1000 // 30 seconds
    },
    removeOnComplete: true,
    ...options
  });
};

/**
 * Schedule event reminders for an event
 * @param {Object} event - The event object
 * @param {Array} attendees - Array of attendee objects
 */
export const scheduleEventReminders = async (event, attendees) => {
  try {
    logger.info(`Scheduling reminders for event: ${event.id}`);
    
    // Calculate reminder times
    const eventTime = new Date(event.startDate).getTime();
    const dayBefore = eventTime - (24 * 60 * 60 * 1000); // 24 hours before
    const hourBefore = eventTime - (60 * 60 * 1000); // 1 hour before
    
    // Current time
    const now = Date.now();
    
    // Schedule reminders for each attendee
    for (const attendee of attendees) {
      // Day before reminder (if there's still time)
      if (dayBefore > now) {
        await queueEventReminder({
          eventId: event.id,
          userId: attendee.userId,
          reminderType: 'day-before',
          delay: dayBefore - now
        });
      }
      
      // Hour before reminder (if there's still time)
      if (hourBefore > now) {
        await queueEventReminder({
          eventId: event.id,
          userId: attendee.userId,
          reminderType: 'hour-before',
          delay: hourBefore - now
        });
      }
    }
    
    logger.info(`Scheduled reminders for ${attendees.length} attendees of event ${event.id}`);
  } catch (error) {
    logger.error(`Error scheduling event reminders: ${error.message}`);
    throw error;
  }
};

/**
 * Process queues with the provided processors
 * @param {Object} processors - Object mapping queue names to processor functions
 */
export const startQueueProcessors = (processors = {}) => {
  if (processors.email) {
    emailQueue.process(processors.email);
    logger.info('Email queue processor started');
  }
  
  if (processors.eventReminder) {
    eventReminderQueue.process(processors.eventReminder);
    logger.info('Event reminder queue processor started');
  }
  
  if (processors.imageProcessing) {
    imageProcessingQueue.process(processors.imageProcessing);
    logger.info('Image processing queue processor started');
  }
};

/**
 * Close all queue connections gracefully
 */
export const closeQueues = async () => {
  try {
    logger.info('Closing job queues...');
    
    await Promise.all(queues.map(queue => queue.close()));
    
    logger.info('All job queues closed successfully');
  } catch (error) {
    logger.error(`Error closing job queues: ${error.message}`);
    throw error;
  }
};

// Export queues for direct access if needed
export const queuesMap = {
  email: emailQueue,
  eventReminder: eventReminderQueue,
  imageProcessing: imageProcessingQueue
};

export default {
  queueEmail,
  queueEventReminder,
  queueImageProcessing,
  scheduleEventReminders,
  startQueueProcessors,
  closeQueues,
  queues: queuesMap
};