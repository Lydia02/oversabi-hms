# Oversabi Hospital Management System (HMS) API Documentation

## Overview

Oversabi HMS is a comprehensive healthcare management system designed for seamless health records transfer across hospitals in Nigeria. The system enables doctors to create and manage patient medical reports, while patients can view and download their medical history.

**Live API URL:** `https://oversabi-hms.onrender.com/api/v1`
**Swagger Documentation:** `https://oversabi-hms.onrender.com/api-docs`

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication Flow](#authentication-flow)
3. [User Roles & Permissions](#user-roles--permissions)
4. [API Endpoints](#api-endpoints)
5. [Error Handling](#error-handling)
6. [Testing Guide](#testing-guide)
7. [Sample Data](#sample-data)

---

## Getting Started

### Base URL
```
Production: https://oversabi-hms.onrender.com/api/v1
Development: http://localhost:3000/api/v1
```

### Quick Start (For Testing)

1. **Seed the database with sample data:**
   ```
   POST /seed/all
   ```

2. **Get test credentials:**
   ```
   GET /seed/credentials
   ```

3. **Login with a sample account:**
   ```
   POST /auth/login
   {
     "uniqueId": "PAT_101",
     "password": "Password123!"
   }
   ```

4. **Use the access token for authenticated requests:**
   ```
   Authorization: Bearer <access_token>
   ```

---

## Authentication Flow

### Registration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     REGISTRATION FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐     ┌──────────────┐     ┌─────────────────┐     │
│  │  User    │────▶│  POST /auth  │────▶│  Validate       │     │
│  │  Form    │     │  /register   │     │  Input Data     │     │
│  └──────────┘     └──────────────┘     └────────┬────────┘     │
│                                                  │               │
│                                                  ▼               │
│                                        ┌─────────────────┐      │
│                                        │  Is Doctor?     │      │
│                                        └────────┬────────┘      │
│                                                  │               │
│                          ┌───────────────────────┼───────────┐  │
│                          │ YES                   │ NO        │  │
│                          ▼                       ▼           │  │
│                 ┌─────────────────┐    ┌─────────────────┐   │  │
│                 │  Verify MDCN    │    │  Create User    │   │  │
│                 │  Number         │    │  Account        │   │  │
│                 └────────┬────────┘    └────────┬────────┘   │  │
│                          │                      │            │  │
│                          ▼                      │            │  │
│                 ┌─────────────────┐             │            │  │
│                 │  Get Hospital   │             │            │  │
│                 │  Name from MDCN │             │            │  │
│                 └────────┬────────┘             │            │  │
│                          │                      │            │  │
│                          ▼                      │            │  │
│                 ┌─────────────────┐             │            │  │
│                 │  Create User    │◀────────────┘            │  │
│                 │  Account        │                          │  │
│                 └────────┬────────┘                          │  │
│                          │                                   │  │
│                          ▼                                   │  │
│                 ┌─────────────────┐                          │  │
│                 │  Generate       │                          │  │
│                 │  Unique ID      │                          │  │
│                 │  DOC_XXX/PAT_XXX│                          │  │
│                 └────────┬────────┘                          │  │
│                          │                                   │  │
│                          ▼                                   │  │
│                 ┌─────────────────┐                          │  │
│                 │  Send Email     │                          │  │
│                 │  with Unique ID │                          │  │
│                 └────────┬────────┘                          │  │
│                          │                                   │  │
│                          ▼                                   │  │
│                 ┌─────────────────┐                          │  │
│                 │  Return Tokens  │                          │  │
│                 │  & User Data    │                          │  │
│                 └─────────────────┘                          │  │
│                                                              │  │
└──────────────────────────────────────────────────────────────┘  │
```

### Login Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        LOGIN FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐     ┌──────────────┐     ┌─────────────────┐     │
│  │  User    │────▶│  POST /auth  │────▶│  Find User by   │     │
│  │  Login   │     │  /login      │     │  Unique ID      │     │
│  └──────────┘     └──────────────┘     └────────┬────────┘     │
│                                                  │               │
│       Input:                                     ▼               │
│       - uniqueId (DOC_XXX/PAT_XXX)    ┌─────────────────┐       │
│       - password                       │  Verify         │       │
│                                        │  Password       │       │
│                                        └────────┬────────┘       │
│                                                  │               │
│                                                  ▼               │
│                                        ┌─────────────────┐       │
│                                        │  Generate       │       │
│                                        │  Access Token   │       │
│                                        │  (24h expiry)   │       │
│                                        └────────┬────────┘       │
│                                                  │               │
│                                                  ▼               │
│                                        ┌─────────────────┐       │
│                                        │  Generate       │       │
│                                        │  Refresh Token  │       │
│                                        │  (7 days expiry)│       │
│                                        └────────┬────────┘       │
│                                                  │               │
│                                                  ▼               │
│                                        ┌─────────────────┐       │
│       Output:                          │  Return         │       │
│       - accessToken                    │  Tokens & User  │       │
│       - refreshToken                   └─────────────────┘       │
│       - user object                                              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Token Refresh Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOKEN REFRESH FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  When: Access token expires (after 24 hours)                    │
│                                                                  │
│  ┌──────────────┐     ┌──────────────────┐     ┌────────────┐  │
│  │ 401 Error    │────▶│ POST /auth       │────▶│ New Tokens │  │
│  │ TOKEN_EXPIRED│     │ /refresh-token   │     │ Returned   │  │
│  └──────────────┘     └──────────────────┘     └────────────┘  │
│                                                                  │
│  Request Body:                                                   │
│  {                                                               │
│    "refreshToken": "<your_refresh_token>"                       │
│  }                                                               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## User Roles & Permissions

### Role: DOCTOR

| Feature | Permission |
|---------|------------|
| Register | Requires valid MDCN number |
| Login | Using DOC_XXX unique ID |
| Search Patients | By patient unique ID (PAT_XXX) |
| Create Medical Reports | For any patient |
| Edit Medical Reports | Only own reports |
| Delete Medical Reports | Only own reports |
| View Medical Reports | All reports |

### Role: PATIENT

| Feature | Permission |
|---------|------------|
| Register | No MDCN required |
| Login | Using PAT_XXX unique ID |
| View Own Reports | All reports created for them |
| Download Single Report | As PDF |
| Download All Reports | As single PDF |

---

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login with unique ID | No |
| POST | `/auth/refresh-token` | Refresh access token | No |
| GET | `/auth/me` | Get current user profile | Yes |

### MDCN Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/mdcn/seed` | Seed sample MDCN records | No |
| GET | `/mdcn/verify/:mdcnNumber` | Verify MDCN number | No |
| GET | `/mdcn/sample-numbers` | Get sample MDCN numbers | No |
| GET | `/mdcn` | Get all MDCN records | Yes (Admin) |

### Medical Reports Endpoints (Doctor)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/medical-reports` | Create new report | Yes (Doctor) |
| GET | `/medical-reports/search/:patientUniqueId` | Search patient reports | Yes (Doctor) |
| GET | `/medical-reports/my-reports` | Get doctor's own reports | Yes (Doctor) |
| GET | `/medical-reports/:reportId` | Get specific report | Yes |
| PUT | `/medical-reports/:reportId` | Update report | Yes (Doctor, Owner) |
| DELETE | `/medical-reports/:reportId` | Delete report | Yes (Doctor, Owner) |

### Patient Reports Endpoints (Patient)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/patient-reports` | Get own medical reports | Yes (Patient) |
| GET | `/patient-reports/:reportId` | Get specific report | Yes (Patient) |
| GET | `/patient-reports/:reportId/download` | Download report as PDF | Yes (Patient) |
| GET | `/patient-reports/download-all` | Download all reports as PDF | Yes (Patient) |

### Seed Data Endpoints (Testing)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/seed/all` | Seed all sample data | No |
| POST | `/seed/patients` | Seed 10 patients | No |
| POST | `/seed/doctors` | Seed 2 doctors | No |
| POST | `/seed/reports` | Seed medical reports | No |
| GET | `/seed/credentials` | Get test credentials | No |

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `BAD_REQUEST` | 400 | Invalid input data |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `TOKEN_EXPIRED` | 401 | Access token has expired |
| `INVALID_TOKEN` | 401 | Token is malformed |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `INTERNAL_ERROR` | 500 | Server error |

### Handling Token Expiration

```javascript
// Frontend Implementation Example
async function apiRequest(url, options) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (response.status === 401) {
      const data = await response.json();

      if (data.code === 'TOKEN_EXPIRED') {
        // Refresh the token
        const newTokens = await refreshAccessToken();

        // Retry the request with new token
        return fetch(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${newTokens.accessToken}`,
            ...options.headers
          }
        });
      }
    }

    return response;
  } catch (error) {
    throw error;
  }
}
```

---

## Testing Guide

### Step-by-Step Testing Flow

#### 1. Setup Test Environment

```bash
# Seed all sample data
POST https://oversabi-hms.onrender.com/api/v1/seed/all

# Response includes default passwords
{
  "success": true,
  "data": {
    "credentials": {
      "patientPassword": "Password123!",
      "doctorPassword": "DoctorPass123!"
    }
  }
}
```

#### 2. Test Doctor Flow

```bash
# Step 1: Login as Doctor
POST /auth/login
{
  "uniqueId": "DOC_201",
  "password": "DoctorPass123!"
}

# Step 2: Search for a patient
GET /medical-reports/search/PAT_101
Authorization: Bearer <access_token>

# Step 3: Create a medical report
POST /medical-reports
Authorization: Bearer <access_token>
{
  "patientUniqueId": "PAT_101",
  "title": "Follow-up Consultation",
  "chiefComplaint": "Patient returns for follow-up",
  "presentIllness": "Symptoms have improved since last visit",
  "diagnosis": "Recovery from Malaria",
  "treatment": "Continue rest and hydration"
}

# Step 4: View your created reports
GET /medical-reports/my-reports
Authorization: Bearer <access_token>
```

#### 3. Test Patient Flow

```bash
# Step 1: Login as Patient
POST /auth/login
{
  "uniqueId": "PAT_101",
  "password": "Password123!"
}

# Step 2: View your medical reports
GET /patient-reports
Authorization: Bearer <access_token>

# Step 3: Download a specific report as PDF
GET /patient-reports/<reportId>/download
Authorization: Bearer <access_token>

# Step 4: Download complete medical history
GET /patient-reports/download-all
Authorization: Bearer <access_token>
```

#### 4. Test New Registration

```bash
# First, get valid MDCN numbers for doctor registration
GET /mdcn/sample-numbers

# Register a new doctor
POST /auth/register
{
  "firstName": "Tochukwu",
  "lastName": "Okafor",
  "age": 38,
  "email": "dr.tochukwu@hospital.com",
  "phoneNumber": "08012345678",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "role": "doctor",
  "mdcnNumber": "MDCN/2020/12345"
}

# Register a new patient
POST /auth/register
{
  "firstName": "Adaeze",
  "lastName": "Nwachukwu",
  "age": 29,
  "email": "adaeze@email.com",
  "phoneNumber": "08098765432",
  "password": "MyPassword123!",
  "confirmPassword": "MyPassword123!",
  "role": "patient"
}
```

---

## Sample Data

### Sample Patients (10 Nigerian Users)

| Unique ID | Name | Age | Condition | Email |
|-----------|------|-----|-----------|-------|
| PAT_101 | Chidinma Okonkwo | 32 | Malaria and Typhoid | chidinma.okonkwo@gmail.com |
| PAT_102 | Oluwaseun Adeyemi | 45 | Hypertension | seun.adeyemi@yahoo.com |
| PAT_103 | Amina Bello | 28 | Diabetes Type 2 | amina.bello@gmail.com |
| PAT_104 | Chukwuemeka Eze | 55 | Arthritis | emeka.eze@outlook.com |
| PAT_105 | Folake Ogundimu | 38 | Asthma | folake.ogundimu@gmail.com |
| PAT_106 | Ibrahim Musa | 62 | Chronic Back Pain | ibrahim.musa@yahoo.com |
| PAT_107 | Ngozi Nnamdi | 25 | Peptic Ulcer | ngozi.nnamdi@gmail.com |
| PAT_108 | Tunde Bakare | 41 | High Cholesterol | tunde.bakare@hotmail.com |
| PAT_109 | Hauwa Suleiman | 35 | Migraine | hauwa.suleiman@gmail.com |
| PAT_110 | Obiora Okeke | 50 | Pneumonia | obiora.okeke@yahoo.com |

**Default Password:** `Password123!`

### Sample Doctors (2 Nigerian Doctors)

| Unique ID | Name | Hospital | Specialization |
|-----------|------|----------|----------------|
| DOC_201 | Dr. Adebayo Ogunlesi | Lagos University Teaching Hospital (LUTH) | General Surgery |
| DOC_202 | Dr. Ngozi Okonkwo | National Hospital Abuja | Cardiology |

**Default Password:** `DoctorPass123!`

### Sample MDCN Numbers (For Registration Testing)

| MDCN Number | Hospital | Doctor Name |
|-------------|----------|-------------|
| MDCN/2020/12345 | Lagos University Teaching Hospital (LUTH) | Dr. Adebayo Ogunlesi |
| MDCN/2019/67890 | National Hospital Abuja | Dr. Ngozi Okonkwo |
| MDCN/2021/11111 | University of Nigeria Teaching Hospital (UNTH) | Dr. Emeka Nwosu |
| MDCN/2018/22222 | Ahmadu Bello University Teaching Hospital | Dr. Fatima Bello |
| MDCN/2022/33333 | University College Hospital (UCH) Ibadan | Dr. Oluwaseun Adeleke |

---

## Frontend Integration Checklist

### Authentication
- [ ] Implement registration form with role-based fields (MDCN for doctors)
- [ ] Implement login form with uniqueId and password
- [ ] Store access token and refresh token securely
- [ ] Implement token refresh logic on 401 errors
- [ ] Implement logout (clear tokens)

### Doctor Dashboard
- [ ] Patient search by unique ID
- [ ] Create medical report form
- [ ] View/Edit/Delete own reports
- [ ] List all created reports with pagination

### Patient Dashboard
- [ ] View all medical reports
- [ ] View individual report details
- [ ] Download single report as PDF
- [ ] Download complete medical history as PDF

### Error Handling
- [ ] Display validation errors per field
- [ ] Handle network errors gracefully
- [ ] Show user-friendly error messages
- [ ] Implement loading states

---

## Support

For technical support or questions:
- **Email:** support@oversabi.com
- **GitHub Issues:** Report bugs and feature requests

---

*Last Updated: January 2024*
*Version: 1.0.0*
