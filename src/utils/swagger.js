// src/utils/swagger.js
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import config from '../../src/config/config.js';
import logger from './logger.js';

/**
 * Configure and set up Swagger documentation
 * @param {Express} app - Express application instance
 */
const setupSwagger = (app) => {
  // Swagger definition
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Community Events API',
        version: config.version,
        description: 'API documentation for the Community Events application',
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
        contact: {
          name: 'API Support',
          url: 'https://community-events.example.com/support',
          email: 'support@community-events.example.com',
        },
      },
      servers: [
        {
          url: `http://localhost:${config.port}/api`,
          description: 'Development server',
        },
        {
          url: 'https://api.community-events.example.com/api',
          description: 'Production server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
        schemas: {
          // User schemas
          User: {
            type: 'object',
            required: ['username', 'email', 'password'],
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                description: 'User ID',
              },
              username: {
                type: 'string',
                description: 'User\'s unique username',
              },
              email: {
                type: 'string',
                format: 'email',
                description: 'User\'s email address',
              },
              firstName: {
                type: 'string',
                description: 'User\'s first name',
              },
              lastName: {
                type: 'string',
                description: 'User\'s last name',
              },
              bio: {
                type: 'string',
                description: 'User\'s biography',
              },
              profileImage: {
                type: 'string',
                format: 'uri',
                description: 'URL to user\'s profile image',
              },
              isAdmin: {
                type: 'boolean',
                description: 'Whether the user has admin privileges',
              },
              isVerified: {
                type: 'boolean',
                description: 'Whether the user\'s email is verified',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'When the user was created',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'When the user was last updated',
              },
            },
          },
          UserCreate: {
            type: 'object',
            required: ['username', 'email', 'password'],
            properties: {
              username: {
                type: 'string',
                description: 'User\'s unique username',
              },
              email: {
                type: 'string',
                format: 'email',
                description: 'User\'s email address',
              },
              password: {
                type: 'string',
                format: 'password',
                description: 'User\'s password',
              },
              firstName: {
                type: 'string',
                description: 'User\'s first name',
              },
              lastName: {
                type: 'string',
                description: 'User\'s last name',
              },
              bio: {
                type: 'string',
                description: 'User\'s biography',
              },
              profileImage: {
                type: 'string',
                format: 'uri',
                description: 'URL to user\'s profile image',
              },
            },
          },
          UserUpdate: {
            type: 'object',
            properties: {
              firstName: {
                type: 'string',
                description: 'User\'s first name',
              },
              lastName: {
                type: 'string',
                description: 'User\'s last name',
              },
              bio: {
                type: 'string',
                description: 'User\'s biography',
              },
              profileImage: {
                type: 'string',
                format: 'uri',
                description: 'URL to user\'s profile image',
              },
            },
          },
          UserResponse: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                description: 'User ID',
              },
              username: {
                type: 'string',
                description: 'User\'s unique username',
              },
              email: {
                type: 'string',
                format: 'email',
                description: 'User\'s email address',
              },
              firstName: {
                type: 'string',
                description: 'User\'s first name',
              },
              lastName: {
                type: 'string',
                description: 'User\'s last name',
              },
              bio: {
                type: 'string',
                description: 'User\'s biography',
              },
              profileImage: {
                type: 'string',
                format: 'uri',
                description: 'URL to user\'s profile image',
              },
              isAdmin: {
                type: 'boolean',
                description: 'Whether the user has admin privileges',
              },
              isVerified: {
                type: 'boolean',
                description: 'Whether the user\'s email is verified',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'When the user was created',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'When the user was last updated',
              },
            },
          },
          
          // Event schemas
          Event: {
            type: 'object',
            required: ['title', 'startDate', 'endDate', 'location', 'organizerId', 'categoryId'],
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                description: 'Event ID',
              },
              title: {
                type: 'string',
                description: 'Event title',
              },
              description: {
                type: 'string',
                description: 'Event description',
              },
              startDate: {
                type: 'string',
                format: 'date-time',
                description: 'Event start date and time',
              },
              endDate: {
                type: 'string',
                format: 'date-time',
                description: 'Event end date and time',
              },
              location: {
                type: 'string',
                description: 'Event location (address)',
              },
              locationLat: {
                type: 'number',
                format: 'float',
                description: 'Event location latitude',
              },
              locationLng: {
                type: 'number',
                format: 'float',
                description: 'Event location longitude',
              },
              maxAttendees: {
                type: 'integer',
                description: 'Maximum number of attendees',
              },
              isPublic: {
                type: 'boolean',
                description: 'Whether the event is public',
              },
              image: {
                type: 'string',
                format: 'uri',
                description: 'URL to event image',
              },
              organizerId: {
                type: 'string',
                format: 'uuid',
                description: 'ID of the user organizing the event',
              },
              categoryId: {
                type: 'string',
                format: 'uuid',
                description: 'ID of the event category',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'When the event was created',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'When the event was last updated',
              },
            },
          },
          EventCreate: {
            type: 'object',
            required: ['title', 'startDate', 'endDate', 'location', 'categoryId'],
            properties: {
              title: {
                type: 'string',
                description: 'Event title',
              },
              description: {
                type: 'string',
                description: 'Event description',
              },
              startDate: {
                type: 'string',
                format: 'date-time',
                description: 'Event start date and time',
              },
              endDate: {
                type: 'string',
                format: 'date-time',
                description: 'Event end date and time',
              },
              location: {
                type: 'string',
                description: 'Event location (address)',
              },
              locationLat: {
                type: 'number',
                format: 'float',
                description: 'Event location latitude',
              },
              locationLng: {
                type: 'number',
                format: 'float',
                description: 'Event location longitude',
              },
              maxAttendees: {
                type: 'integer',
                description: 'Maximum number of attendees',
              },
              isPublic: {
                type: 'boolean',
                description: 'Whether the event is public',
              },
              image: {
                type: 'string',
                format: 'uri',
                description: 'URL to event image',
              },
              categoryId: {
                type: 'string',
                format: 'uuid',
                description: 'ID of the event category',
              },
            },
          },
          EventUpdate: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Event title',
              },
              description: {
                type: 'string',
                description: 'Event description',
              },
              startDate: {
                type: 'string',
                format: 'date-time',
                description: 'Event start date and time',
              },
              endDate: {
                type: 'string',
                format: 'date-time',
                description: 'Event end date and time',
              },
              location: {
                type: 'string',
                description: 'Event location (address)',
              },
              locationLat: {
                type: 'number',
                format: 'float',
                description: 'Event location latitude',
              },
              locationLng: {
                type: 'number',
                format: 'float',
                description: 'Event location longitude',
              },
              maxAttendees: {
                type: 'integer',
                description: 'Maximum number of attendees',
              },
              isPublic: {
                type: 'boolean',
                description: 'Whether the event is public',
              },
              image: {
                type: 'string',
                format: 'uri',
                description: 'URL to event image',
              },
              categoryId: {
                type: 'string',
                format: 'uuid',
                description: 'ID of the event category',
              },
            },
          },
          EventResponse: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                description: 'Event ID',
              },
              title: {
                type: 'string',
                description: 'Event title',
              },
              description: {
                type: 'string',
                description: 'Event description',
              },
              startDate: {
                type: 'string',
                format: 'date-time',
                description: 'Event start date and time',
              },
              endDate: {
                type: 'string',
                format: 'date-time',
                description: 'Event end date and time',
              },
              location: {
                type: 'string',
                description: 'Event location (address)',
              },
              locationLat: {
                type: 'number',
                format: 'float',
                description: 'Event location latitude',
              },
              locationLng: {
                type: 'number',
                format: 'float',
                description: 'Event location longitude',
              },
              maxAttendees: {
                type: 'integer',
                description: 'Maximum number of attendees',
              },
              isPublic: {
                type: 'boolean',
                description: 'Whether the event is public',
              },
              image: {
                type: 'string',
                format: 'uri',
                description: 'URL to event image',
              },
              organizer: {
                $ref: '#/components/schemas/UserResponse',
              },
              category: {
                $ref: '#/components/schemas/Category',
              },
              attendeeCount: {
                type: 'integer',
                description: 'Number of confirmed attendees',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'When the event was created',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'When the event was last updated',
              },
            },
          },
          
          // Category schemas
          Category: {
            type: 'object',
            required: ['name'],
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                description: 'Category ID',
              },
              name: {
                type: 'string',
                description: 'Category name',
              },
              description: {
                type: 'string',
                description: 'Category description',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'When the category was created',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'When the category was last updated',
              },
            },
          },
          CategoryCreate: {
            type: 'object',
            required: ['name'],
            properties: {
              name: {
                type: 'string',
                description: 'Category name',
              },
              description: {
                type: 'string',
                description: 'Category description',
              },
            },
          },
          
          // Attendee schemas
          Attendee: {
            type: 'object',
            required: ['userId', 'eventId', 'status'],
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                description: 'Attendee record ID',
              },
              userId: {
                type: 'string',
                format: 'uuid',
                description: 'ID of the user attending',
              },
              eventId: {
                type: 'string',
                format: 'uuid',
                description: 'ID of the event being attended',
              },
              status: {
                type: 'string',
                enum: ['pending', 'confirmed', 'declined', 'no-show'],
                description: 'Attendance status',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'When the attendee record was created',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'When the attendee record was last updated',
              },
            },
          },
          AttendeeCreate: {
            type: 'object',
            required: ['eventId'],
            properties: {
              eventId: {
                type: 'string',
                format: 'uuid',
                description: 'ID of the event to attend',
              },
            },
          },
          AttendeeUpdate: {
            type: 'object',
            required: ['status'],
            properties: {
              status: {
                type: 'string',
                enum: ['pending', 'confirmed', 'declined', 'no-show'],
                description: 'New attendance status',
              },
            },
          },
          
          // Authentication schemas
          Login: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: {
                type: 'string',
                format: 'email',
                description: 'User\'s email address',
              },
              password: {
                type: 'string',
                format: 'password',
                description: 'User\'s password',
              },
            },
          },
          AuthResponse: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
                description: 'JWT authentication token',
              },
              user: {
                $ref: '#/components/schemas/UserResponse',
              },
            },
          },
          
          // Error schemas
          Error: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                description: 'Error status',
              },
              message: {
                type: 'string',
                description: 'Error message',
              },
              errors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: {
                      type: 'string',
                      description: 'Field with error',
                    },
                    message: {
                      type: 'string',
                      description: 'Error message for this field',
                    },
                  },
                },
                description: 'Validation errors',
              },
            },
          },
          
          // Health check schema
          HealthCheck: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['healthy', 'degraded', 'unhealthy'],
                description: 'Overall system health status',
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
                description: 'Time of health check',
              },
              services: {
                type: 'object',
                properties: {
                  database: {
                    type: 'object',
                    properties: {
                      status: {
                        type: 'string',
                        enum: ['healthy', 'degraded', 'unhealthy'],
                        description: 'Database health status',
                      },
                      message: {
                        type: 'string',
                        description: 'Additional information about database health',
                      },
                    },
                  },
                  redis: {
                    type: 'object',
                    properties: {
                      status: {
                        type: 'string',
                        enum: ['healthy', 'degraded', 'unhealthy'],
                        description: 'Redis health status',
                      },
                      message: {
                        type: 'string',
                        description: 'Additional information about Redis health',
                      },
                    },
                  },
                },
              },
            },
          },
          
          // Database seeding schema
          SeedingStatus: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['success', 'error'],
                description: 'Status of the seeding operation',
              },
              message: {
                type: 'string',
                description: 'Information about the seeding operation',
              },
              details: {
                type: 'object',
                properties: {
                  users: {
                    type: 'integer',
                    description: 'Number of users seeded',
                  },
                  categories: {
                    type: 'integer',
                    description: 'Number of categories seeded',
                  },
                  events: {
                    type: 'integer',
                    description: 'Number of events seeded',
                  },
                  attendees: {
                    type: 'integer',
                    description: 'Number of attendees seeded',
                  },
                },
              },
            },
          },
        },
        responses: {
          UnauthorizedError: {
            description: 'Authentication information is missing or invalid',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          NotFoundError: {
            description: 'The specified resource was not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          ValidationError: {
            description: 'The request data failed validation',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          ServerError: {
            description: 'An internal server error occurred',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
    apis: ['./src/routes/*.js'], // Path to the API routes files
  };

  // Initialize swagger-jsdoc
  const swaggerSpec = swaggerJsdoc(swaggerOptions);

  // Serve swagger docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Community Events API Documentation',
  }));

  // Serve swagger spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  logger.info('Swagger documentation initialized');
};

export default setupSwagger;