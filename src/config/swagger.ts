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

## Getting Started

### 1. Setup Test Data
Before testing, seed the MDCN database:
\`\`\`
POST /api/v1/mdcn/seed
\`\`\`

### 2. Get Sample MDCN Numbers
Get valid MDCN numbers for doctor registration:
\`\`\`
GET /api/v1/mdcn/sample-numbers
\`\`\`

### 3. Register a User
- **Doctors:** Require valid MDCN number from step 2
- **Patients:** No MDCN number required

### 4. Check Email
After registration, users receive an email with their unique login ID:
- Doctors: \`DOC_XXX\`
- Patients: \`PAT_XXX\`

### 5. Login
Use the unique ID and password to login and get access tokens.

---

## User Roles

| Role | Description | Capabilities |
|------|-------------|--------------|
| **Doctor** | Medical professional with MDCN verification | Create/Edit/Delete medical reports, Search patients |
| **Patient** | Healthcare recipient | View own reports, Download PDF reports |

---

## Authentication Flow

1. **Register** → Receive unique ID via email
2. **Login** → Get access token (24h) + refresh token (7 days)
3. **Use API** → Include token in Authorization header
4. **Refresh** → Use refresh token when access token expires

### Authorization Header
\`\`\`
Authorization: Bearer <access_token>
\`\`\`

---

## Error Codes

| Code | Description |
|------|-------------|
| \`BAD_REQUEST\` | Invalid input data |
| \`UNAUTHORIZED\` | Missing or invalid token |
| \`FORBIDDEN\` | Insufficient permissions |
| \`NOT_FOUND\` | Resource not found |
| \`CONFLICT\` | Resource already exists |
| \`VALIDATION_ERROR\` | Input validation failed |
| \`TOKEN_EXPIRED\` | Access token has expired |
| \`INVALID_TOKEN\` | Token is malformed |

---

## Quick Reference

### Doctor Workflow
1. Register with MDCN number
2. Login with unique ID
3. Search patient by \`PAT_XXX\`
4. Create medical reports
5. Edit/Delete own reports

### Patient Workflow
1. Register (no MDCN required)
2. Login with unique ID
3. View medical reports
4. Download individual or all reports as PDF
      `,
      contact: {
        name: 'Oversabi Support',
        email: 'support@oversabi.com'
      }
    },
    servers: [
      {
        url: 'https://oversabi-hms.onrender.com/api/v1',
        description: 'Production server'
      },
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
          bearerFormat: 'JWT',
          description: 'Enter your access token obtained from the /auth/login endpoint'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          description: 'Standard error response',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', description: 'Human-readable error message' },
            code: { type: 'string', description: 'Error code for client handling', example: 'NOT_FOUND' },
            error: { type: 'string', description: 'Additional error details (dev mode only)' }
          }
        },
        ValidationError: {
          type: 'object',
          description: 'Validation error response with field-level details',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation failed' },
            code: { type: 'string', example: 'VALIDATION_ERROR' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'Valid email is required' }
                }
              }
            }
          }
        },
        Pagination: {
          type: 'object',
          description: 'Pagination metadata included in list responses',
          properties: {
            page: { type: 'integer', description: 'Current page number', example: 1 },
            limit: { type: 'integer', description: 'Items per page', example: 10 },
            total: { type: 'integer', description: 'Total number of items', example: 100 },
            totalPages: { type: 'integer', description: 'Total number of pages', example: 10 }
          }
        },
        MedicalReport: {
          type: 'object',
          description: 'Medical report created by a doctor for a patient',
          properties: {
            id: { type: 'string', description: 'Unique report ID' },
            patientId: { type: 'string', description: 'Patient user ID' },
            patientUniqueId: { type: 'string', example: 'PAT_123' },
            patientName: { type: 'string', example: 'Jane Smith' },
            doctorId: { type: 'string', description: 'Doctor user ID' },
            doctorUniqueId: { type: 'string', example: 'DOC_456' },
            doctorName: { type: 'string', example: 'Dr. John Doe' },
            hospitalName: { type: 'string', example: 'Lagos University Teaching Hospital' },
            title: { type: 'string', example: 'General Consultation' },
            chiefComplaint: { type: 'string', description: 'Patient main complaint' },
            presentIllness: { type: 'string', description: 'History of present illness' },
            pastMedicalHistory: { type: 'string' },
            familyHistory: { type: 'string' },
            socialHistory: { type: 'string' },
            physicalExamination: { type: 'string' },
            vitalSigns: {
              type: 'object',
              properties: {
                bloodPressure: { type: 'string', example: '120/80' },
                heartRate: { type: 'number', example: 72 },
                temperature: { type: 'number', example: 36.5 },
                weight: { type: 'number', example: 70 },
                height: { type: 'number', example: 175 },
                oxygenSaturation: { type: 'number', example: 98 }
              }
            },
            diagnosis: { type: 'string', example: 'Tension headache' },
            diagnosisCode: { type: 'string', description: 'ICD-10 code', example: 'G44.2' },
            treatment: { type: 'string' },
            medications: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Paracetamol' },
                  dosage: { type: 'string', example: '500mg' },
                  frequency: { type: 'string', example: '3 times daily' },
                  duration: { type: 'string', example: '5 days' }
                }
              }
            },
            labResults: { type: 'string' },
            imaging: { type: 'string' },
            recommendations: { type: 'string' },
            followUpDate: { type: 'string', format: 'date' },
            status: { type: 'string', enum: ['draft', 'final', 'amended'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        User: {
          type: 'object',
          description: 'User profile information',
          properties: {
            id: { type: 'string' },
            uniqueId: { type: 'string', example: 'DOC_123', description: 'Login ID (DOC_XXX or PAT_XXX)' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            otherName: { type: 'string', example: 'Michael' },
            age: { type: 'integer', example: 35 },
            email: { type: 'string', format: 'email' },
            phoneNumber: { type: 'string', example: '08012345678' },
            role: { type: 'string', enum: ['patient', 'doctor'] },
            hospitalName: { type: 'string', description: 'Only for doctors' },
            mdcnNumber: { type: 'string', description: 'Only for doctors' },
            isVerified: { type: 'boolean' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    tags: [
      {
        name: 'Auth',
        description: `
**Authentication and User Management**

Register new users (doctors or patients) and manage authentication tokens.

- Doctors require MDCN verification during registration
- Users receive unique login IDs via email (DOC_XXX or PAT_XXX)
- Login returns JWT access token (24h) and refresh token (7 days)
        `
      },
      {
        name: 'MDCN',
        description: `
**Medical and Dental Council of Nigeria Verification**

Manage and verify MDCN records for doctor registration.

**Testing Steps:**
1. Call \`POST /mdcn/seed\` to populate sample data
2. Call \`GET /mdcn/sample-numbers\` to get valid MDCN numbers
3. Use a sample MDCN number when registering as a doctor
        `
      },
      {
        name: 'Medical Reports',
        description: `
**Doctor Endpoints - Medical Report Management**

Create, read, update, and delete medical reports for patients.

**Access:** Doctors only (requires authentication)

**Features:**
- Search patients by unique ID (PAT_XXX)
- Create comprehensive medical reports
- Edit/Delete only reports you created
- View all reports you've created
        `
      },
      {
        name: 'Patient Reports',
        description: `
**Patient Endpoints - View Own Medical Records**

Access and download your own medical reports.

**Access:** Patients only (requires authentication)

**Features:**
- View all your medical reports
- View individual report details
- Download single report as PDF
- Download complete medical history as PDF
        `
      },
      {
        name: 'Seed Data',
        description: `
**Development/Testing Only - Sample Data Generation**

Seed the database with sample Nigerian patients, doctors, and medical reports for testing.

**Quick Start:**
1. Call \`POST /seed/all\` to seed all sample data at once
2. Call \`GET /seed/credentials\` to get login credentials

**Sample Data Includes:**
- 10 Nigerian patients with common health conditions
- 2 Nigerian doctors at LUTH and National Hospital Abuja
- Sample medical reports linking patients to doctors

**Default Passwords:**
- Patients: \`Password123!\`
- Doctors: \`DoctorPass123!\`
        `
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
