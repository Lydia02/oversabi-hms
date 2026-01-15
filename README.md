# Oversabi Hospital Management System

A comprehensive healthcare management system designed for seamless health records transfer across hospitals in Nigeria.

## Features

- **Health ID System**: Unique identifier for every patient with QR code support
- **Medical Records**: Longitudinal health records with consent-based access
- **Multi-Provider Support**: Hospitals, Pharmacies, Labs, Telemedicine
- **Consent Management**: Patient-controlled data access with audit logging
- **Referral System**: Seamless patient referrals between doctors/departments
- **Emergency Access**: Critical patient data accessible in emergencies

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: Firebase Firestore
- **Authentication**: JWT with OTP verification
- **Documentation**: Swagger/OpenAPI

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project with Firestore enabled

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd oversabi
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your Firebase credentials and other settings
```

4. Start the development server:
```bash
npm run dev
```

5. Access the API documentation at `http://localhost:3000/api-docs`

## Project Structure

```
src/
├── config/           # Configuration files (Firebase, Swagger, etc.)
├── controllers/      # Route handlers
├── middleware/       # Express middleware (auth, validation, errors)
├── routes/           # API route definitions
├── services/         # Business logic
├── types/            # TypeScript types and interfaces
└── utils/            # Helper functions
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login with email/password
- `POST /api/v1/auth/send-otp` - Send OTP to phone
- `POST /api/v1/auth/verify-otp` - Verify OTP
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `GET /api/v1/auth/me` - Get current user

### Patients
- `POST /api/v1/patients` - Create patient with Health ID
- `GET /api/v1/patients/me` - Get current patient profile
- `GET /api/v1/patients/:id` - Get patient by ID
- `GET /api/v1/patients/health-id/:healthId` - Get patient by Health ID
- `GET /api/v1/patients/phone/:phoneNumber` - Get patient by phone
- `PATCH /api/v1/patients/:id` - Update patient
- `GET /api/v1/patients/:id/visits` - Get patient visits
- `GET /api/v1/patients/:id/prescriptions` - Get patient prescriptions
- `GET /api/v1/patients/:id/lab-tests` - Get patient lab tests
- `GET /api/v1/patients/emergency/:healthId` - Get emergency profile

### Doctors
- `POST /api/v1/doctors` - Create doctor profile
- `GET /api/v1/doctors/me` - Get current doctor profile
- `GET /api/v1/doctors/:id` - Get doctor by ID
- `GET /api/v1/doctors/:id/patients` - Get assigned patients
- `GET /api/v1/doctors/:id/stats` - Get workload statistics
- `PATCH /api/v1/doctors/:id/availability` - Set availability
- `GET /api/v1/doctors/hospital/:hospitalId/available` - Get available doctors
- `POST /api/v1/doctors/:id/refer` - Refer patient
- `POST /api/v1/doctors/:id/referrals/accept/:referralId` - Accept referral

### Visits
- `POST /api/v1/visits` - Create visit
- `GET /api/v1/visits/:id` - Get visit
- `GET /api/v1/visits/:id/details` - Get visit with full details
- `POST /api/v1/visits/:id/start` - Start scheduled visit
- `POST /api/v1/visits/:id/complete` - Complete visit
- `POST /api/v1/visits/:id/vitals` - Record vital signs
- `POST /api/v1/visits/:id/diagnosis` - Add diagnosis

### Consent
- `POST /api/v1/consent/grant` - Grant consent
- `POST /api/v1/consent/grant-full` - Grant full access for visit
- `POST /api/v1/consent/emergency` - Emergency access
- `POST /api/v1/consent/:consentId/revoke` - Revoke consent
- `GET /api/v1/consent/patient/:patientId` - Get patient consents
- `GET /api/v1/consent/patient/:patientId/access-logs` - Get access audit logs

## User Roles

- `patient` - Patients with Health ID
- `doctor` - Medical doctors
- `pharmacist` - Pharmacy staff
- `lab_technician` - Laboratory staff
- `admin` - System administrator
- `hospital_admin` - Hospital administrator

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Type check without emitting

## License

ISC
