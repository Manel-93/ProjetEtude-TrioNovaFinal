import swaggerJsdoc from 'swagger-jsdoc';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TrioNova API',
      version: '1.0.0',
      description: 'API REST pour la plateforme e-commerce TrioNova / AltheaSystems',
      contact: {
        name: 'Support API',
        email: 'support@trionova.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Serveur de développement'
      },
      {
        url: 'https://api.trionova.com/api',
        description: 'Serveur de production'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenu via /auth/login'
        },
        guestToken: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Guest-Token',
          description: 'Token invité pour les paniers non authentifiés'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  example: 'ValidationError'
                },
                message: {
                  type: 'string',
                  example: 'Message d\'erreur détaillé'
                }
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object'
            },
            message: {
              type: 'string',
              example: 'Opération réussie'
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              example: 1
            },
            limit: {
              type: 'integer',
              example: 20
            },
            total: {
              type: 'integer',
              example: 100
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentification',
        description: 'Endpoints pour l\'authentification et la gestion des tokens'
      },
      {
        name: 'Utilisateurs',
        description: 'Gestion du profil utilisateur et des adresses'
      },
      {
        name: 'Admin',
        description: 'Endpoints réservés aux administrateurs'
      },
      {
        name: 'Produits',
        description: 'Consultation et gestion des produits'
      },
      {
        name: 'Panier',
        description: 'Gestion du panier (utilisateur ou invité)'
      },
      {
        name: 'Paiements',
        description: 'Gestion des paiements via Stripe'
      },
      {
        name: 'Commandes',
        description: 'Gestion des commandes et factures'
      },
      {
        name: 'Contact',
        description: 'Formulaire de contact et gestion des messages'
      },
      {
        name: 'Chatbot',
        description: 'Chatbot FAQ et escalade vers un humain'
      }
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js']
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

