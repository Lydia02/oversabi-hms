import { collections } from '../config/firebase.js';
import {
  Treatment,
  PatientComplaint,
  Diagnosis,
  Medication,
  Severity
} from '../types/index.js';
import { generateId, parsePagination } from '../utils/helpers.js';
import { NotFoundError } from '../utils/errors.js';

export interface CreateTreatmentData {
  patientId: string;
  doctorId: string;
  hospitalId: string;
  visitId?: string;
  complaint: string;
  symptoms: string[];
  examination: string;
  diagnosis: Diagnosis;
  treatmentPlan: string;
  medications: Medication[];
  procedures?: string[];
  followUpDate?: Date;
  notes?: string;
}

export interface UpdateTreatmentData {
  examination?: string;
  diagnosis?: Diagnosis;
  treatmentPlan?: string;
  medications?: Medication[];
  procedures?: string[];
  followUpDate?: Date;
  notes?: string;
  status?: 'ongoing' | 'completed' | 'discontinued';
}

export interface CreateComplaintData {
  patientId: string;
  complaint: string;
  description: string;
  severity: Severity;
  onsetDate: Date;
  duration?: string;
  relatedSymptoms: string[];
  previousTreatment?: string;
  attachments?: string[];
}

export class TreatmentService {
  // ===== TREATMENT METHODS =====

  /**
   * Create a treatment record
   */
  async createTreatment(data: CreateTreatmentData): Promise<Treatment> {
    const treatmentId = generateId();
    const now = new Date();

    const treatment: Treatment = {
      id: treatmentId,
      patientId: data.patientId,
      doctorId: data.doctorId,
      hospitalId: data.hospitalId,
      visitId: data.visitId,
      complaint: data.complaint,
      symptoms: data.symptoms,
      examination: data.examination,
      diagnosis: data.diagnosis,
      treatmentPlan: data.treatmentPlan,
      medications: data.medications,
      procedures: data.procedures,
      followUpDate: data.followUpDate,
      notes: data.notes,
      status: 'ongoing',
      createdAt: now,
      updatedAt: now
    };

    await collections.treatments.doc(treatmentId).set(treatment);

    return treatment;
  }

  /**
   * Get treatment by ID
   */
  async getTreatmentById(treatmentId: string): Promise<Treatment> {
    const doc = await collections.treatments.doc(treatmentId).get();

    if (!doc.exists) {
      throw new NotFoundError('Treatment not found');
    }

    return doc.data() as Treatment;
  }

  /**
   * Update treatment
   */
  async updateTreatment(treatmentId: string, data: UpdateTreatmentData): Promise<Treatment> {
    const treatment = await this.getTreatmentById(treatmentId);

    const updatedTreatment: Treatment = {
      ...treatment,
      ...data,
      updatedAt: new Date()
    };

    await collections.treatments.doc(treatmentId).set(updatedTreatment, { merge: true });

    return updatedTreatment;
  }

  /**
   * Get patient treatments
   */
  async getPatientTreatments(
    patientId: string,
    status?: 'ongoing' | 'completed' | 'discontinued',
    page?: number,
    limit?: number
  ): Promise<{ treatments: Treatment[]; total: number }> {
    const { limit: l, offset } = parsePagination(page, limit);

    let query = collections.treatments.where('patientId', '==', patientId);

    if (status) {
      query = query.where('status', '==', status);
    }

    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(l)
      .get();

    const treatments = snapshot.docs.map(doc => doc.data() as Treatment);

    return { treatments, total };
  }

  /**
   * Get doctor treatments
   */
  async getDoctorTreatments(
    doctorId: string,
    page?: number,
    limit?: number
  ): Promise<{ treatments: Treatment[]; total: number }> {
    const { limit: l, offset } = parsePagination(page, limit);

    const query = collections.treatments.where('doctorId', '==', doctorId);

    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(l)
      .get();

    const treatments = snapshot.docs.map(doc => doc.data() as Treatment);

    return { treatments, total };
  }

  /**
   * Get active treatments for patient
   */
  async getActiveTreatments(patientId: string): Promise<Treatment[]> {
    const snapshot = await collections.treatments
      .where('patientId', '==', patientId)
      .where('status', '==', 'ongoing')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => doc.data() as Treatment);
  }

  /**
   * Complete treatment
   */
  async completeTreatment(treatmentId: string): Promise<Treatment> {
    return this.updateTreatment(treatmentId, { status: 'completed' });
  }

  /**
   * Discontinue treatment
   */
  async discontinueTreatment(treatmentId: string, notes?: string): Promise<Treatment> {
    return this.updateTreatment(treatmentId, { status: 'discontinued', notes });
  }

  // ===== PATIENT COMPLAINT METHODS =====

  /**
   * Create patient complaint
   */
  async createComplaint(data: CreateComplaintData): Promise<PatientComplaint> {
    const complaintId = generateId();
    const now = new Date();

    const complaint: PatientComplaint = {
      id: complaintId,
      patientId: data.patientId,
      complaint: data.complaint,
      description: data.description,
      severity: data.severity,
      onsetDate: data.onsetDate,
      duration: data.duration,
      relatedSymptoms: data.relatedSymptoms,
      previousTreatment: data.previousTreatment,
      attachments: data.attachments,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };

    await collections.patientComplaints.doc(complaintId).set(complaint);

    return complaint;
  }

  /**
   * Get complaint by ID
   */
  async getComplaintById(complaintId: string): Promise<PatientComplaint> {
    const doc = await collections.patientComplaints.doc(complaintId).get();

    if (!doc.exists) {
      throw new NotFoundError('Complaint not found');
    }

    return doc.data() as PatientComplaint;
  }

  /**
   * Get patient complaints
   */
  async getPatientComplaints(
    patientId: string,
    status?: 'pending' | 'reviewed' | 'addressed',
    page?: number,
    limit?: number
  ): Promise<{ complaints: PatientComplaint[]; total: number }> {
    const { limit: l, offset } = parsePagination(page, limit);

    let query = collections.patientComplaints.where('patientId', '==', patientId);

    if (status) {
      query = query.where('status', '==', status);
    }

    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(l)
      .get();

    const complaints = snapshot.docs.map(doc => doc.data() as PatientComplaint);

    return { complaints, total };
  }

  /**
   * Review complaint
   */
  async reviewComplaint(complaintId: string, reviewedBy: string): Promise<PatientComplaint> {
    const complaint = await this.getComplaintById(complaintId);
    const now = new Date();

    const updatedComplaint: PatientComplaint = {
      ...complaint,
      status: 'reviewed',
      reviewedBy,
      reviewedAt: now,
      updatedAt: now
    };

    await collections.patientComplaints.doc(complaintId).set(updatedComplaint, { merge: true });

    return updatedComplaint;
  }

  /**
   * Address complaint
   */
  async addressComplaint(complaintId: string, reviewedBy: string): Promise<PatientComplaint> {
    const complaint = await this.getComplaintById(complaintId);
    const now = new Date();

    const updatedComplaint: PatientComplaint = {
      ...complaint,
      status: 'addressed',
      reviewedBy,
      reviewedAt: now,
      updatedAt: now
    };

    await collections.patientComplaints.doc(complaintId).set(updatedComplaint, { merge: true });

    return updatedComplaint;
  }

  /**
   * Get pending complaints for hospital
   */
  async getPendingComplaints(hospitalId?: string): Promise<PatientComplaint[]> {
    const snapshot = await collections.patientComplaints
      .where('status', '==', 'pending')
      .orderBy('severity', 'desc')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    return snapshot.docs.map(doc => doc.data() as PatientComplaint);
  }
}

export const treatmentService = new TreatmentService();
