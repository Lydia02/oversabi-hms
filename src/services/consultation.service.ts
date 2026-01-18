import { collections } from '../config/firebase.js';
import {
  ConsultationRecord,
  Diagnosis
} from '../types/index.js';
import { generateId, parsePagination } from '../utils/helpers.js';
import { NotFoundError } from '../utils/errors.js';

export interface CreateConsultationData {
  patientId: string;
  doctorId: string;
  hospitalId: string;
  departmentId?: string;
  visitId?: string;
  appointmentId?: string;
  consultationDate: Date;
  symptoms: string[];
  diagnosis?: Diagnosis;
  specialist: string;
  notes?: string;
  followUpRequired?: boolean;
  followUpDate?: Date;
}

export interface UpdateConsultationData {
  symptoms?: string[];
  diagnosis?: Diagnosis;
  notes?: string;
  followUpRequired?: boolean;
  followUpDate?: Date;
}

export class ConsultationService {
  /**
   * Create a new consultation record
   */
  async createConsultation(data: CreateConsultationData): Promise<ConsultationRecord> {
    const consultationId = generateId();
    const now = new Date();

    const consultation: ConsultationRecord = {
      id: consultationId,
      patientId: data.patientId,
      doctorId: data.doctorId,
      hospitalId: data.hospitalId,
      departmentId: data.departmentId,
      visitId: data.visitId,
      appointmentId: data.appointmentId,
      consultationDate: data.consultationDate,
      symptoms: data.symptoms,
      diagnosis: data.diagnosis,
      specialist: data.specialist,
      notes: data.notes,
      followUpRequired: data.followUpRequired || false,
      followUpDate: data.followUpDate,
      createdAt: now,
      updatedAt: now
    };

    await collections.consultationRecords.doc(consultationId).set(consultation);

    return consultation;
  }

  /**
   * Get consultation by ID
   */
  async getConsultationById(consultationId: string): Promise<ConsultationRecord> {
    const doc = await collections.consultationRecords.doc(consultationId).get();

    if (!doc.exists) {
      throw new NotFoundError('Consultation record not found');
    }

    return doc.data() as ConsultationRecord;
  }

  /**
   * Update consultation record
   */
  async updateConsultation(
    consultationId: string,
    data: UpdateConsultationData
  ): Promise<ConsultationRecord> {
    const consultation = await this.getConsultationById(consultationId);

    const updatedConsultation: ConsultationRecord = {
      ...consultation,
      ...data,
      updatedAt: new Date()
    };

    await collections.consultationRecords.doc(consultationId).set(updatedConsultation, { merge: true });

    return updatedConsultation;
  }

  /**
   * Get consultations for a patient
   */
  async getPatientConsultations(
    patientId: string,
    page?: number,
    limit?: number
  ): Promise<{ consultations: ConsultationRecord[]; total: number }> {
    const { limit: l, offset } = parsePagination(page, limit);

    const query = collections.consultationRecords.where('patientId', '==', patientId);

    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    const snapshot = await query
      .orderBy('consultationDate', 'desc')
      .offset(offset)
      .limit(l)
      .get();

    const consultations = snapshot.docs.map(doc => doc.data() as ConsultationRecord);

    return { consultations, total };
  }

  /**
   * Get consultations by doctor
   */
  async getDoctorConsultations(
    doctorId: string,
    page?: number,
    limit?: number
  ): Promise<{ consultations: ConsultationRecord[]; total: number }> {
    const { limit: l, offset } = parsePagination(page, limit);

    const query = collections.consultationRecords.where('doctorId', '==', doctorId);

    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    const snapshot = await query
      .orderBy('consultationDate', 'desc')
      .offset(offset)
      .limit(l)
      .get();

    const consultations = snapshot.docs.map(doc => doc.data() as ConsultationRecord);

    return { consultations, total };
  }

  /**
   * Get consultations for a visit
   */
  async getVisitConsultations(visitId: string): Promise<ConsultationRecord[]> {
    const snapshot = await collections.consultationRecords
      .where('visitId', '==', visitId)
      .orderBy('consultationDate', 'desc')
      .get();

    return snapshot.docs.map(doc => doc.data() as ConsultationRecord);
  }

  /**
   * Get recent consultations for a patient
   */
  async getRecentConsultations(
    patientId: string,
    limitCount: number = 10
  ): Promise<ConsultationRecord[]> {
    const snapshot = await collections.consultationRecords
      .where('patientId', '==', patientId)
      .orderBy('consultationDate', 'desc')
      .limit(limitCount)
      .get();

    return snapshot.docs.map(doc => doc.data() as ConsultationRecord);
  }

  /**
   * Get consultations requiring follow-up
   */
  async getFollowUpRequired(doctorId: string): Promise<ConsultationRecord[]> {
    const snapshot = await collections.consultationRecords
      .where('doctorId', '==', doctorId)
      .where('followUpRequired', '==', true)
      .orderBy('followUpDate')
      .get();

    return snapshot.docs.map(doc => doc.data() as ConsultationRecord);
  }

  /**
   * Get consultations by hospital
   */
  async getHospitalConsultations(
    hospitalId: string,
    page?: number,
    limit?: number
  ): Promise<{ consultations: ConsultationRecord[]; total: number }> {
    const { limit: l, offset } = parsePagination(page, limit);

    const query = collections.consultationRecords.where('hospitalId', '==', hospitalId);

    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    const snapshot = await query
      .orderBy('consultationDate', 'desc')
      .offset(offset)
      .limit(l)
      .get();

    const consultations = snapshot.docs.map(doc => doc.data() as ConsultationRecord);

    return { consultations, total };
  }

  /**
   * Get consultations by department
   */
  async getDepartmentConsultations(
    departmentId: string,
    page?: number,
    limit?: number
  ): Promise<{ consultations: ConsultationRecord[]; total: number }> {
    const { limit: l, offset } = parsePagination(page, limit);

    const query = collections.consultationRecords.where('departmentId', '==', departmentId);

    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    const snapshot = await query
      .orderBy('consultationDate', 'desc')
      .offset(offset)
      .limit(l)
      .get();

    const consultations = snapshot.docs.map(doc => doc.data() as ConsultationRecord);

    return { consultations, total };
  }
}

export const consultationService = new ConsultationService();
