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
  otpVerifications: db.collection('otpVerifications')
};

export default admin;
