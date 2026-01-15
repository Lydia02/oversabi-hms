import { collections } from '../config/firebase.js';
import {
  Pharmacy,
  Pharmacist,
  PharmacyVisit,
  Prescription,
  PrescriptionStatus,
  Medication,
  Patient,
  Severity
} from '../types/index.js';
import { generateId, parsePagination } from '../utils/helpers.js';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors.js';

export interface CreatePharmacyData {
  name: string;
  hospitalId?: string;
  address: {
    street?: string;
    city: string;
    state: string;
    country: string;
    postalCode?: string;
  };
  phoneNumber: string;
  licenseNumber: string;
}

export interface CreatePharmacistData {
  userId: string;
  pharmacyId: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  phoneNumber: string;
  email: string;
}

export interface CreatePharmacyVisitData {
  patientId: string;
  pharmacyId: string;
  pharmacistId: string;
  symptoms: string[];
  dispensedMedications?: Medication[];
  redFlagsDetected?: string[];
  referralRequired?: boolean;
  notes?: string;
}

export class PharmacyService {
  /**
   * Create a new pharmacy
   */
  async createPharmacy(data: CreatePharmacyData): Promise<Pharmacy> {
    // Check if pharmacy with same license number exists
    const existing = await collections.pharmacies
      .where('licenseNumber', '==', data.licenseNumber)
      .limit(1)
      .get();

    if (!existing.empty) {
      throw new ConflictError('Pharmacy with this license number already exists');
    }

    const pharmacyId = generateId();
    const now = new Date();

    const pharmacy: Pharmacy = {
      id: pharmacyId,
      name: data.name,
      hospitalId: data.hospitalId,
      address: data.address,
      phoneNumber: data.phoneNumber,
      licenseNumber: data.licenseNumber,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    await collections.pharmacies.doc(pharmacyId).set(pharmacy);

    return pharmacy;
  }

  /**
   * Get pharmacy by ID
   */
  async getPharmacyById(pharmacyId: string): Promise<Pharmacy> {
    const doc = await collections.pharmacies.doc(pharmacyId).get();

    if (!doc.exists) {
      throw new NotFoundError('Pharmacy not found');
    }

    return doc.data() as Pharmacy;
  }

  /**
   * Create a new pharmacist profile
   */
  async createPharmacist(data: CreatePharmacistData): Promise<Pharmacist> {
    // Check if pharmacist with same license number exists
    const existing = await collections.pharmacists
      .where('licenseNumber', '==', data.licenseNumber)
      .limit(1)
      .get();

    if (!existing.empty) {
      throw new ConflictError('Pharmacist with this license number already exists');
    }

    // Verify pharmacy exists
    await this.getPharmacyById(data.pharmacyId);

    const pharmacistId = generateId();
    const now = new Date();

    const pharmacist: Pharmacist = {
      id: pharmacistId,
      userId: data.userId,
      pharmacyId: data.pharmacyId,
      firstName: data.firstName,
      lastName: data.lastName,
      licenseNumber: data.licenseNumber,
      phoneNumber: data.phoneNumber,
      email: data.email,
      createdAt: now,
      updatedAt: now
    };

    await collections.pharmacists.doc(pharmacistId).set(pharmacist);

    return pharmacist;
  }

  /**
   * Get pharmacist by ID
   */
  async getPharmacistById(pharmacistId: string): Promise<Pharmacist> {
    const doc = await collections.pharmacists.doc(pharmacistId).get();

    if (!doc.exists) {
      throw new NotFoundError('Pharmacist not found');
    }

    return doc.data() as Pharmacist;
  }

  /**
   * Get pharmacist by user ID
   */
  async getPharmacistByUserId(userId: string): Promise<Pharmacist> {
    const snapshot = await collections.pharmacists
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new NotFoundError('Pharmacist profile not found');
    }

    return snapshot.docs[0].data() as Pharmacist;
  }

  /**
   * Get patient prescriptions that need to be dispensed
   */
  async getPendingPrescriptions(
    pharmacyId: string,
    page?: number,
    limit?: number
  ): Promise<{ prescriptions: Prescription[]; total: number }> {
    const { limit: l, offset } = parsePagination(page, limit);

    // Get pharmacy to verify it exists
    await this.getPharmacyById(pharmacyId);

    // Get active (not dispensed) prescriptions
    const countSnapshot = await collections.prescriptions
      .where('status', '==', PrescriptionStatus.ACTIVE)
      .count()
      .get();
    const total = countSnapshot.data().count;

    const snapshot = await collections.prescriptions
      .where('status', '==', PrescriptionStatus.ACTIVE)
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(l)
      .get();

    const prescriptions = snapshot.docs.map(doc => doc.data() as Prescription);

    return { prescriptions, total };
  }

  /**
   * Get prescription by ID
   */
  async getPrescriptionById(prescriptionId: string): Promise<Prescription> {
    const doc = await collections.prescriptions.doc(prescriptionId).get();

    if (!doc.exists) {
      throw new NotFoundError('Prescription not found');
    }

    return doc.data() as Prescription;
  }

  /**
   * Get patient prescriptions by Health ID
   */
  async getPatientPrescriptionsByHealthId(
    healthId: string
  ): Promise<{ prescriptions: Prescription[]; patient: Patient }> {
    // Find patient by health ID
    const patientSnapshot = await collections.patients
      .where('healthId', '==', healthId)
      .limit(1)
      .get();

    if (patientSnapshot.empty) {
      throw new NotFoundError('Patient not found');
    }

    const patient = patientSnapshot.docs[0].data() as Patient;

    // Get active prescriptions for this patient
    const prescriptionsSnapshot = await collections.prescriptions
      .where('patientId', '==', patient.id)
      .where('status', '==', PrescriptionStatus.ACTIVE)
      .orderBy('createdAt', 'desc')
      .get();

    const prescriptions = prescriptionsSnapshot.docs.map(doc => doc.data() as Prescription);

    return { prescriptions, patient };
  }

  /**
   * Dispense a prescription
   */
  async dispensePrescription(
    prescriptionId: string,
    pharmacistId: string
  ): Promise<Prescription> {
    const prescription = await this.getPrescriptionById(prescriptionId);

    if (prescription.status !== PrescriptionStatus.ACTIVE) {
      throw new BadRequestError('Prescription is not active');
    }

    // Verify pharmacist exists
    await this.getPharmacistById(pharmacistId);

    const now = new Date();
    const updatedPrescription: Prescription = {
      ...prescription,
      status: PrescriptionStatus.DISPENSED,
      dispensedBy: pharmacistId,
      dispensedAt: now,
      updatedAt: now
    };

    await collections.prescriptions.doc(prescriptionId).set(updatedPrescription, { merge: true });

    return updatedPrescription;
  }

  /**
   * Create a pharmacy visit (pharmacy-first flow)
   */
  async createPharmacyVisit(data: CreatePharmacyVisitData): Promise<PharmacyVisit> {
    // Verify pharmacy exists
    await this.getPharmacyById(data.pharmacyId);

    // Verify pharmacist exists
    await this.getPharmacistById(data.pharmacistId);

    // Verify patient exists
    const patientDoc = await collections.patients.doc(data.patientId).get();
    if (!patientDoc.exists) {
      throw new NotFoundError('Patient not found');
    }

    const visitId = generateId();
    const now = new Date();

    const pharmacyVisit: PharmacyVisit = {
      id: visitId,
      patientId: data.patientId,
      pharmacyId: data.pharmacyId,
      pharmacistId: data.pharmacistId,
      symptoms: data.symptoms,
      dispensedMedications: data.dispensedMedications || [],
      redFlagsDetected: data.redFlagsDetected || [],
      referralRequired: data.referralRequired || false,
      notes: data.notes,
      createdAt: now,
      updatedAt: now
    };

    await collections.pharmacyVisits.doc(visitId).set(pharmacyVisit);

    return pharmacyVisit;
  }

  /**
   * Get pharmacy visit by ID
   */
  async getPharmacyVisitById(visitId: string): Promise<PharmacyVisit> {
    const doc = await collections.pharmacyVisits.doc(visitId).get();

    if (!doc.exists) {
      throw new NotFoundError('Pharmacy visit not found');
    }

    return doc.data() as PharmacyVisit;
  }

  /**
   * Update pharmacy visit with red flags and referral
   */
  async updatePharmacyVisit(
    visitId: string,
    data: {
      redFlagsDetected?: string[];
      referralRequired?: boolean;
      referralId?: string;
      dispensedMedications?: Medication[];
      notes?: string;
    }
  ): Promise<PharmacyVisit> {
    const visit = await this.getPharmacyVisitById(visitId);

    const updatedVisit: PharmacyVisit = {
      ...visit,
      ...data,
      updatedAt: new Date()
    };

    await collections.pharmacyVisits.doc(visitId).set(updatedVisit, { merge: true });

    return updatedVisit;
  }

  /**
   * Get pharmacy visits for a patient
   */
  async getPatientPharmacyVisits(
    patientId: string,
    page?: number,
    limit?: number
  ): Promise<{ visits: PharmacyVisit[]; total: number }> {
    const { limit: l, offset } = parsePagination(page, limit);

    const countSnapshot = await collections.pharmacyVisits
      .where('patientId', '==', patientId)
      .count()
      .get();
    const total = countSnapshot.data().count;

    const snapshot = await collections.pharmacyVisits
      .where('patientId', '==', patientId)
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(l)
      .get();

    const visits = snapshot.docs.map(doc => doc.data() as PharmacyVisit);

    return { visits, total };
  }

  /**
   * Get all pharmacies
   */
  async getPharmacies(
    page?: number,
    limit?: number
  ): Promise<{ pharmacies: Pharmacy[]; total: number }> {
    const { limit: l, offset } = parsePagination(page, limit);

    const countSnapshot = await collections.pharmacies
      .where('isActive', '==', true)
      .count()
      .get();
    const total = countSnapshot.data().count;

    const snapshot = await collections.pharmacies
      .where('isActive', '==', true)
      .offset(offset)
      .limit(l)
      .get();

    const pharmacies = snapshot.docs.map(doc => doc.data() as Pharmacy);

    return { pharmacies, total };
  }

  /**
   * Get pharmacists by pharmacy
   */
  async getPharmacistsByPharmacy(pharmacyId: string): Promise<Pharmacist[]> {
    const snapshot = await collections.pharmacists
      .where('pharmacyId', '==', pharmacyId)
      .get();

    return snapshot.docs.map(doc => doc.data() as Pharmacist);
  }
}

export const pharmacyService = new PharmacyService();
