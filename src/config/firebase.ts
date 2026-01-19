import admin from 'firebase-admin';
import { config } from './index.js';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebase.projectId,
      privateKey: config.firebase.privateKey,
      clientEmail: config.firebase.clientEmail
    }),
    databaseURL: config.firebase.databaseURL
  });
}

export const db = admin.firestore();

// Configure Firestore to ignore undefined values
db.settings({ ignoreUndefinedProperties: true });

export const auth = admin.auth();

// Collection references
export const collections = {
  users: db.collection('users'),
  patients: db.collection('patients'),
  doctors: db.collection('doctors'),
  hospitals: db.collection('hospitals'),
  pharmacies: db.collection('pharmacies'),
  pharmacists: db.collection('pharmacists'),
  labCenters: db.collection('labCenters'),
  labTechnicians: db.collection('labTechnicians'),
  visits: db.collection('visits'),
  prescriptions: db.collection('prescriptions'),
  labTests: db.collection('labTests'),
  consents: db.collection('consents'),
  accessLogs: db.collection('accessLogs'),
  referrals: db.collection('referrals'),
  pharmacyVisits: db.collection('pharmacyVisits'),
  otpVerifications: db.collection('otpVerifications'),
  // New collections
  departments: db.collection('departments'),
  beds: db.collection('beds'),
  appointments: db.collection('appointments'),
  documents: db.collection('documents'),
  consultationRecords: db.collection('consultationRecords'),
  // Messages and Calendar
  messages: db.collection('messages'),
  conversations: db.collection('conversations'),
  calendarEvents: db.collection('calendarEvents'),
  // Treatments
  treatments: db.collection('treatments'),
  patientComplaints: db.collection('patientComplaints'),
  // Statistics
  patientStatistics: db.collection('patientStatistics'),
  doctorStatistics: db.collection('doctorStatistics'),
  // MDCN Verification
  mdcnRecords: db.collection('mdcnRecords'),
  // Medical Reports
  medicalReports: db.collection('medicalReports')
};

export default admin;
