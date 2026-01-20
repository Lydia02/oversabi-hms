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

---

## Complete End-to-End User Flows

### 🏥 DOCTOR FLOW: From Registration to Report Management

#### 1. Register as Doctor
\`\`\`
POST /auth/register
\`\`\`
- Provide: firstName, lastName, age, email, phoneNumber, password, confirmPassword, role (doctor), mdcnNumber
- Response: Confirmation message
- Email: Unique Doctor ID (DOC_XXX) sent to your email

#### 2. Receive Login Credentials
- Check your email for unique Doctor ID (DOC_XXX) and confirm it's linked to your account
- Your MDCN number is verified and marked as used - cannot be reused

#### 3. Login
\`\`\`
POST /auth/login
\`\`\`
- Use: uniqueId (DOC_XXX) + password
- Response: Access token (24 hours) + Refresh token (7 days) + Your profile details

#### 4. Search for Patient
\`\`\`
GET /medical-reports/search-patient?uniqueId=PAT_123
\`\`\`
- Returns: Patient details if patient ID is valid
- Use this to verify patient exists before creating report

#### 5. Create Medical Report for Patient
\`\`\`
POST /medical-reports
\`\`\`
- Provide: patientUniqueId, title, chiefComplaint, presentIllness, diagnosis, treatment
- Optional: pastMedicalHistory, familyHistory, socialHistory, physicalExamination, vitalSigns, diagnosisCode, medications, labResults, imaging, recommendations, followUpDate
- Response: Report created with unique ID, timestamp, and status (draft/final)

#### 6. Edit Your Report
\`\`\`
PUT /medical-reports/{reportId}
\`\`\`
- Update any fields in the report
- Can only edit reports you created
- Response: Updated report

#### 7. Delete Your Report
\`\`\`
DELETE /medical-reports/{reportId}
\`\`\`
- Permanently removes the report
- Can only delete reports you created
- Response: Deletion confirmation

#### 8. View Your Reports
\`\`\`
GET /medical-reports
\`\`\`
- List all reports you've created
- Supports pagination (page, limit)
- Filter by status, patient, date range

#### 9. Refresh Token (When Access Token Expires)
\`\`\`
POST /auth/refresh-token
\`\`\`
- Use your refresh token to get a new access token
- Refresh token lasts 7 days

---

### 👤 PATIENT FLOW: From Registration to Viewing Reports

#### 1. Register as Patient
\`\`\`
POST /auth/register
\`\`\`
- Provide: firstName, lastName, age, email, phoneNumber, password, confirmPassword, role (patient)
- Note: No MDCN number required for patients
- Response: Confirmation message
- Email: Unique Patient ID (PAT_XXX) sent to your email

#### 2. Receive Login Credentials
- Check your email for unique Patient ID (PAT_XXX)
- This ID is how doctors will identify you in the system

#### 3. Login
\`\`\`
POST /auth/login
\`\`\`
- Use: uniqueId (PAT_XXX) + password
- Response: Access token (24 hours) + Refresh token (7 days) + Your profile details

#### 4. View All Your Medical Reports
\`\`\`
GET /patient-reports
\`\`\`
- See all medical reports created by doctors for you
- Supports pagination (page, limit)
- Reports sorted by creation date (newest first)
- Response: List of all your medical reports with full details

#### 5. View Specific Report Details
\`\`\`
GET /patient-reports/{reportId}
\`\`\`
- View complete details of a single report
- Includes: doctor info, diagnosis, treatment, vital signs, recommendations
- Can only view your own reports

#### 6. Download Single Report as PDF
\`\`\`
GET /patient-reports/{reportId}/download
\`\`\`
- Downloads the specific report as a PDF file
- PDF includes: Report title, doctor info, hospital, diagnosis, treatment, and recommendations
- File name: report-[reportId].pdf

#### 7. Download All Reports as PDF (Complete Medical History)
\`\`\`
GET /patient-reports/download-all
\`\`\`
- Downloads all your medical reports combined in one PDF
- Perfect for transferring complete medical history between hospitals
- File name: medical-history-[patientId].pdf

#### 8. Refresh Token (When Access Token Expires)
\`\`\`
POST /auth/refresh-token
\`\`\`
- Use your refresh token to get a new access token
- Refresh token lasts 7 days

---

## User Roles & Permissions

| Feature | Doctor | Patient |
|---------|--------|---------|
| Register | ✅ (with MDCN) | ✅ |
| Login | ✅ | ✅ |
| Search Patients | ✅ | ❌ |
| Create Reports | ✅ | ❌ |
| Edit Reports | ✅ (own only) | ❌ |
| Delete Reports | ✅ (own only) | ❌ |
| View Reports | ✅ (own created) | ✅ (own received) |
| Download PDF | ❌ | ✅ |

---

## Authentication & Security

### Authorization Header
Include in all authenticated requests:
\`\`\`
Authorization: Bearer <access_token>
\`\`\`

### Token Details
- **Access Token**: Valid for 24 hours
- **Refresh Token**: Valid for 7 days
- **Token Type**: JWT (JSON Web Token)

### Password Requirements
- Minimum 8 characters
- Should include uppercase, lowercase, numbers, and special characters for security

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| \`BAD_REQUEST\` | 400 | Invalid input data |
| \`UNAUTHORIZED\` | 401 | Missing or invalid token |
| \`FORBIDDEN\` | 403 | Insufficient permissions (wrong role) |
| \`NOT_FOUND\` | 404 | Resource not found |
| \`CONFLICT\` | 409 | Resource already exists |
| \`VALIDATION_ERROR\` | 400 | Input validation failed |
| \`TOKEN_EXPIRED\` | 401 | Access token has expired - use refresh token |
| \`INVALID_TOKEN\` | 401 | Token is malformed or invalid |

---

## Important Notes

- **MDCN Verification**: Each MDCN number can only be used ONCE for doctor registration
- **Unique IDs**: Once received, your unique ID (DOC_XXX or PAT_XXX) is permanent and used for all logins
- **Email Delivery**: Make sure to check your email after registration to get your unique login ID
- **Token Refresh**: Keep your refresh token safe - it's needed to get new access tokens when they expire
- **Data Transfer**: Patients can download all reports as PDF to transfer medical history to other hospitals

---

## Test MDCN Numbers for Doctor Registration

Use any of these MDCN numbers when registering as a doctor. **Each can only be used once.**

| MDCN Number | Hospital | Specialization |
|-------------|----------|----------------|
| **MDCN/2020/12345** | Lagos University Teaching Hospital (LUTH) | General Surgery |
| **MDCN/2019/67890** | National Hospital Abuja | Cardiology |
| **MDCN/2021/11111** | University of Nigeria Teaching Hospital (UNTH) | Pediatrics |
| **MDCN/2018/22222** | Ahmadu Bello University Teaching Hospital (ABUTH) | Obstetrics & Gynecology |
| **MDCN/2022/33333** | University College Hospital (UCH) Ibadan | Internal Medicine |
| **MDCN/2020/44444** | Lagos State University Teaching Hospital (LASUTH) | Orthopedics |
| **MDCN/2021/55555** | Obafemi Awolowo University Teaching Hospital (OAUTH) | Neurology |
| **MDCN/2019/66666** | University of Benin Teaching Hospital (UBTH) | Dermatology |
| **MDCN/2022/77777** | Jos University Teaching Hospital (JUTH) | Psychiatry |
| **MDCN/2020/88888** | University of Ilorin Teaching Hospital (UITH) | Ophthalmology |
| **MDCN/2021/99999** | Federal Medical Centre Abeokuta | ENT (Ear, Nose, Throat) |
| **MDCN/2019/10101** | Aminu Kano Teaching Hospital | Radiology |
| **MDCN/2022/20202** | University of Calabar Teaching Hospital (UCTH) | Oncology |
| **MDCN/2020/30303** | Federal Teaching Hospital Owerri | Urology |
| **MDCN/2021/40404** | University of Port Harcourt Teaching Hospital (UPTH) | Anesthesiology |

**Note:** Once an MDCN number is used for registration, it becomes permanently linked to that doctor and cannot be used again.
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
- Both doctors and patients use the same authentication endpoints

**Profile Management:**
- Update profile information (name, age, blood group, genotype, height, weight, profile picture)
- Change password
- View own profile details
        `
      },
      {
        name: 'Medical Reports',
        description: `
**Doctor Endpoints - Medical Report Management**

Create, read, update, and delete medical reports for patients.

**Access:** Doctors only (requires authentication)

**Complete Doctor Report Workflow:**
1. Login to get access token
2. Search for patient by unique ID (PAT_XXX) using \`GET /medical-reports/search-patient\`
3. Create new report using \`POST /medical-reports\`
4. View all your reports using \`GET /medical-reports\`
5. Edit report using \`PUT /medical-reports/{reportId}\`
6. Delete report using \`DELETE /medical-reports/{reportId}\`

**Features:**
- Search patients by unique ID (PAT_XXX)
- Create comprehensive medical reports with diagnosis, treatment, vital signs
- Edit/Delete only reports you created
- View all reports you've created with pagination support
- Status tracking: draft, final, amended
- Automatic notification sent to patient when report is created or updated
        `
      },
      {
        name: 'Patient Reports',
        description: `
**Patient Endpoints - View Own Medical Records**

Access and download your own medical reports.

**Access:** Patients only (requires authentication)

**Complete Patient Report Workflow:**
1. Login to get access token
2. View all your reports using \`GET /patient-reports\`
3. Click on specific report using \`GET /patient-reports/{reportId}\`
4. Download single report as PDF using \`GET /patient-reports/{reportId}/download\`
5. Download complete medical history as PDF using \`GET /patient-reports/download-all\`

**Features:**
- View all your medical reports with pagination
- View individual report details
- Download single report as PDF
- Download complete medical history as PDF (all reports combined)
- Reports sorted by creation date (newest first)
- Receive notifications when new reports are created or updated
        `
      },
      {
        name: 'Documents',
        description: `
**Document Management - Prescriptions, Lab Results, Imaging**

Upload, view, and manage medical documents.

**Access:** Both doctors and patients (requires authentication)

**Features:**
- Upload documents (prescriptions, lab results, x-rays, scans)
- View own documents with filtering by type
- Download documents
- Share documents with specific users
- View documents shared with you
- Delete own documents
- Document types: prescription, lab_result, xray, ultrasound, mri, ct_scan, medical_report, referral_letter, discharge_summary, other

**Workflow:**
1. Doctor uploads prescription/lab result for patient
2. Patient receives notification
3. Patient views/downloads document from their dashboard
4. Patient can share document with other healthcare providers
        `
      },
      {
        name: 'Notifications',
        description: `
**Notification System**

View and manage notifications about medical reports, documents, and system updates.

**Access:** Both doctors and patients (requires authentication)

**Features:**
- View all notifications (paginated)
- Filter to show only unread notifications
- Mark individual notification as read
- Mark all notifications as read
- Delete individual notification
- Delete all notifications
- Get unread notification count

**Notification Types:**
- New medical report created
- Medical report updated
- New document uploaded
- Appointment reminders
- System notifications
- Account updates

**Workflow:**
1. Doctor creates report → Patient gets notification
2. Doctor uploads document → Patient gets notification
3. Patient clicks notification → Redirected to report/document
4. Patient marks notification as read
        `
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
