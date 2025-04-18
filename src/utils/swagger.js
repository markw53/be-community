import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import config from '../../config/config.js';

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Community Events API',
      version: '1.0.0',
      description: 'API for managing community events',
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      },
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: process.env.API_URL || `http://localhost:${config.port}`,
        description: config.env
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string'
            },
            status: {
              type: 'integer'
            },
            details: {
              type: 'array',
              items: {
                type: 'object'
              }
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer'
            },
            email: {
              type: 'string',
              format: 'email'
            },
            displayName: {
              type: 'string'
            },
            role: {
              type: 'string',
              enum: ['user', 'staff', 'admin']
            },
            bio: {
              type: 'string'
            },
            photoUrl: {
              type: 'string',
              format: 'uri'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Event: {
          type: 'object',
          properties: {
            id: {
              type: 'integer'
            },
            title: {
              type: 'string'
            },
            description: {
              type: 'string'
            },
            startTime: {
              type: 'string',
              format: 'date-time'
            },
            endTime: {
              type: 'string',
              format: 'date-time'
            },
            location: {
              type: 'string'
            },
            category: {
              type: 'string'
            },
            organiserId: {
              type: 'integer'
            },
            capacity: {
              type: 'integer'
            },
            isPublished: {
              type: 'boolean'
            },
            isCancelled: {
              type: 'boolean'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js'] // Path to the API routes with JSDoc comments
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Setup swagger middleware
export const setupSwagger = (app) => {
  // Serve swagger docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Community Events API Documentation'
  }));

  // Serve swagger spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

export default setupSwagger;