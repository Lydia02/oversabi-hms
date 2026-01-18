import { collections } from '../config/firebase.js';
import {
  Patient,
  Gender,
  BloodType,
  Genotype,
  PatientStatus,
  Address,
  EmergencyContact,
  MedicalRecord,
  Visit,
  Prescription,
  LabTest
} from '../types/index.js';
import {
  generateId,
  generateHealthId,
  generateMIN,
  generateQRCode,
  formatPhoneNumber,
  parsePagination
} from '../utils/helpers.js';
import {
  NotFoundError,
  ConflictError
} from '../utils/errors.js';

export interface CreatePatientData {
  userId: string;
  firstName: string;
  lastName: string;
  otherName?: string;
  dateOfBirth: Date;
  gender: Gender;
  phoneNumber: string;
  email?: string;
  nin?: string;
  address?: Address;
  bloodType?: BloodType;
  genotype?: Genotype;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContact?: EmergencyContact;
  status?: PatientStatus;
  assignedDoctorId?: string;
  weight?: number;
  height?: number;
}

export interface UpdatePatientData {
  firstName?: string;
  lastName?: string;
  otherName?: string;
  email?: string;
  nin?: string;
  address?: Address;
  bloodType?: BloodType;
  genotype?: Genotype;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContact?: EmergencyContact;
  status?: PatientStatus;
  admissionDate?: Date;
  assignedDoctorId?: string;
  weight?: number;
  height?: number;
}

export class PatientService {
  /**
   * Create a new patient with Health ID
   */
  async createPatient(data: CreatePatientData): Promise<Patient> {
    const formattedPhone = formatPhoneNumber(data.phoneNumber);

    // Check if patient already exists with this phone number
    const existing = await collections.patients
      .where('phoneNumber', '==', formattedPhone)
      .limit(1)
      .get();

    if (!existing.empty) {
      throw new ConflictError('Patient with this phone number already exists');
    }

    const patientId = generateId();
    const healthId = generateHealthId();
    const min = generateMIN();
    const qrCode = await generateQRCode(healthId);
    const now = new Date();

    const patient: Patient = {
      id: patientId,
      userId: data.userId,
      healthId,
      min,
      qrCode,
      firstName: data.firstName,
      lastName: data.lastName,
      otherName: data.otherName,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      phoneNumber: formattedPhone,
      email: data.email,
      nin: data.nin,
      address: data.address,
      bloodType: data.bloodType,
      genotype: data.genotype,
      allergies: data.allergies || [],
      chronicConditions: data.chronicConditions || [],
      emergencyContact: data.emergencyContact,
      status: data.status || PatientStatus.ACTIVE,
      admissionDate: data.status === PatientStatus.ADMITTED ? now : undefined,
      assignedDoctorId: data.assignedDoctorId,
      weight: data.weight,
      height: data.height,
      createdAt: now,
      updatedAt: now
    };

    await collections.patients.doc(patientId).set(patient);

    // Create medical record
    const medicalRecord: MedicalRecord = {
      id: generateId(),
      patientId,
      healthId,
      createdAt: now,
      updatedAt: now
    };

    await collections.patients.doc(patientId).collection('medicalRecord').doc(medicalRecord.id).set(medicalRecord);

    return patient;
  }

  /**
   * Get patient by ID
   */
  async getPatientById(patientId: string): Promise<Patient> {
    const doc = await collections.patients.doc(patientId).get();

    if (!doc.exists) {
      throw new NotFoundError('Patient not found');
    }

    return doc.data() as Patient;
  }

  /**
   * Get patient by Health ID
   */
  async getPatientByHealthId(healthId: string): Promise<Patient> {
    const snapshot = await collections.patients
      .where('healthId', '==', healthId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new NotFoundError('Patient not found');
    }

    return snapshot.docs[0].data() as Patient;
  }

  /**
   * Get patient by MIN (Medical Identification Number)
   */
  async getPatientByMIN(min: string): Promise<Patient> {
    const snapshot = await collections.patients
      .where('min', '==', min)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new NotFoundError('Patient not found');
    }

    return snapshot.docs[0].data() as Patient;
  }

  /**
   * Get patient by phone number
   */
  async getPatientByPhone(phoneNumber: string): Promise<Patient> {
    const formattedPhone = formatPhoneNumber(phoneNumber);

    const snapshot = await collections.patients
      .where('phoneNumber', '==', formattedPhone)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new NotFoundError('Patient not found');
    }

    return snapshot.docs[0].data() as Patient;
  }

  /**
   * Get patient by user ID
   */
  async getPatientByUserId(userId: string): Promise<Patient> {
    const snapshot = await collections.patients
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new NotFoundError('Patient profile not found');
    }

    return snapshot.docs[0].data() as Patient;
  }

  /**
   * Update patient information
   */
  async updatePatient(patientId: string, data: UpdatePatientData): Promise<Patient> {
    const patient = await this.getPatientById(patientId);

    const updatedPatient: Patient = {
      ...patient,
      ...data,
      updatedAt: new Date()
    };

    await collections.patients.doc(patientId).set(updatedPatient, { merge: true });

    return updatedPatient;
  }

  /**
   * Get all patients (paginated)
   */
  async getAllPatients(
    page?: number,
    limit?: number
  ): Promise<{ patients: Patient[]; total: number; page: number; limit: number }> {
    const { page: p, limit: l, offset } = parsePagination(page, limit);

    // Get total count
    const countSnapshot = await collections.patients.count().get();
    const total = countSnapshot.data().count;

    // Get paginated patients
    const snapshot = await collections.patients
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(l)
      .get();

    const patients = snapshot.docs.map(doc => doc.data() as Patient);

    return { patients, total, page: p, limit: l };
  }

  /**
   * Search patients by name or Health ID
   */
  async searchPatients(
    query: string,
    page?: number,
    limit?: number
  ): Promise<{ patients: Patient[]; total: number; page: number; limit: number }> {
    const { page: p, limit: l } = parsePagination(page, limit);
    const queryLower = query.toLowerCase();

    // Note: Firestore doesn't support full-text search
    // For production, consider using Algolia or Elasticsearch
    // This is a basic implementation
    const snapshot = await collections.patients.get();

    const allPatients = snapshot.docs.map(doc => doc.data() as Patient);

    const filtered = allPatients.filter(patient =>
      patient.firstName.toLowerCase().includes(queryLower) ||
      patient.lastName.toLowerCase().includes(queryLower) ||
      patient.healthId.toLowerCase().includes(queryLower)
    );

    const total = filtered.length;
    const startIndex = (p - 1) * l;
    const patients = filtered.slice(startIndex, startIndex + l);

    return { patients, total, page: p, limit: l };
  }

  /**
   * Get patient's visit history
   */
  async getPatientVisits(
    patientId: string,
    page?: number,
    limit?: number
  ): Promise<{ visits: Visit[]; total: number }> {
    const { page: p, limit: l, offset } = parsePagination(page, limit);

    // Verify patient exists
    await this.getPatientById(patientId);

    const countSnapshot = await collections.visits
      .where('patientId', '==', patientId)
      .count()
      .get();
    const total = countSnapshot.data().count;

    const snapshot = await collections.visits
      .where('patientId', '==', patientId)
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(l)
      .get();

    const visits = snapshot.docs.map(doc => doc.data() as Visit);

    return { visits, total };
  }

  /**
   * Get patient's prescriptions
   */
  async getPatientPrescriptions(
    patientId: string,
    page?: number,
    limit?: number
  ): Promise<{ prescriptions: Prescription[]; total: number }> {
    const { page: p, limit: l, offset } = parsePagination(page, limit);

    // Verify patient exists
    await this.getPatientById(patientId);

    const countSnapshot = await collections.prescriptions
      .where('patientId', '==', patientId)
      .count()
      .get();
    const total = countSnapshot.data().count;

    const snapshot = await collections.prescriptions
      .where('patientId', '==', patientId)
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(l)
      .get();

    const prescriptions = snapshot.docs.map(doc => doc.data() as Prescription);

    return { prescriptions, total };
  }

  /**
   * Get patient's lab tests
   */
  async getPatientLabTests(
    patientId: string,
    page?: number,
    limit?: number
  ): Promise<{ labTests: LabTest[]; total: number }> {
    const { page: p, limit: l, offset } = parsePagination(page, limit);

    // Verify patient exists
    await this.getPatientById(patientId);

    const countSnapshot = await collections.labTests
      .where('patientId', '==', patientId)
      .count()
      .get();
    const total = countSnapshot.data().count;

    const snapshot = await collections.labTests
      .where('patientId', '==', patientId)
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(l)
      .get();

    const labTests = snapshot.docs.map(doc => doc.data() as LabTest);

    return { labTests, total };
  }

  /**
   * Get emergency profile (limited data for emergency access)
   */
  async getEmergencyProfile(healthId: string): Promise<{
    healthId: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    bloodType?: BloodType;
    allergies: string[];
    chronicConditions: string[];
    emergencyContact?: EmergencyContact;
  }> {
    const patient = await this.getPatientByHealthId(healthId);

    return {
      healthId: patient.healthId,
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
      bloodType: patient.bloodType,
      allergies: patient.allergies,
      chronicConditions: patient.chronicConditions,
      emergencyContact: patient.emergencyContact
    };
  }

  /**
   * Regenerate QR code for patient
   */
  async regenerateQRCode(patientId: string): Promise<string> {
    const patient = await this.getPatientById(patientId);
    const newQRCode = await generateQRCode(patient.healthId);

    await collections.patients.doc(patientId).set({
      qrCode: newQRCode,
      updatedAt: new Date()
    }, { merge: true });

    return newQRCode;
  }
}

export const patientService = new PatientService();
