import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index.js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Oversabi Hospital Management System API',
      version: '1.0.0',
      description: `
# Oversabi HMS API Documentation

A comprehensive healthcare management system designed for seamless health records transfer across hospitals in Nigeria.

## Core Features
- **Health ID System**: Unique identifier for every patient
- **Medical Records**: Longitudinal health records with consent-based access
- **Multi-Provider Support**: Hospitals, Pharmacies, Labs, Telemedicine
- **Consent Management**: Patient-controlled data access

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
\`\`\`
Authorization: Bearer <access_token>
\`\`\`

## Access Methods
- QR Code scanning
- Health ID lookup
- Phone number + OTP verification
      `,
      contact: {
        name: 'Oversabi Support',
        email: 'support@oversabi.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/v1`,
        description: 'Development server'
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
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            error: { type: 'string' }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 10 }
          }
        }
      }
    },
    tags: [
      { name: 'Auth', description: 'Authentication and authorization endpoints' },
      { name: 'Patients', description: 'Patient management and Health ID' },
      { name: 'Doctors', description: 'Doctor management and availability' },
      { name: 'Visits', description: 'Patient visits and consultations' },
      { name: 'Prescriptions', description: 'Medication prescriptions' },
      { name: 'Lab Tests', description: 'Laboratory tests and results' },
      { name: 'Pharmacy', description: 'Pharmacy operations' },
      { name: 'Referrals', description: 'Patient referrals between providers' },
      { name: 'Consent', description: 'Consent management' }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
