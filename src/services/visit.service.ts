import { collections } from '../config/firebase.js';
import {
  Visit,
  VisitStatus,
  Diagnosis,
  VitalSigns,
  Severity
} from '../types/index.js';
import { generateId, parsePagination } from '../utils/helpers.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { doctorService } from './doctor.service.js';
import { patientService } from './patient.service.js';

export interface CreateVisitData {
  patientId: string;
  doctorId: string;
  hospitalId: string;
  chiefComplaint: string;
  symptoms: string[];
  notes?: string;
  scheduledAt?: Date;
}

export interface UpdateVisitData {
  status?: VisitStatus;
  diagnosis?: Diagnosis;
  notes?: string;
  vitalSigns?: VitalSigns;
  followUpDate?: Date;
}

export class VisitService {
  /**
   * Create a new visit
   */
  async createVisit(data: CreateVisitData): Promise<Visit> {
    // Verify patient exists
    await patientService.getPatientById(data.patientId);

    // Verify doctor exists and is available
    const doctor = await doctorService.getDoctorById(data.doctorId);

    const visitId = generateId();
    const now = new Date();

    const visit: Visit = {
      id: visitId,
      patientId: data.patientId,
      doctorId: data.doctorId,
      hospitalId: data.hospitalId,
      status: data.scheduledAt ? VisitStatus.SCHEDULED : VisitStatus.IN_PROGRESS,
      chiefComplaint: data.chiefComplaint,
      symptoms: data.symptoms,
      notes: data.notes || '',
      prescriptions: [],
      labTests: [],
      createdAt: now,
      updatedAt: now
    };

    await collections.visits.doc(visitId).set(visit);

    // Update doctor's patient count if visit is active
    if (visit.status === VisitStatus.IN_PROGRESS) {
      await collections.doctors.doc(data.doctorId).set({
        currentPatientCount: doctor.currentPatientCount + 1
      }, { merge: true });
    }

    return visit;
  }

  /**
   * Get visit by ID
   */
  async getVisitById(visitId: string): Promise<Visit> {
    const doc = await collections.visits.doc(visitId).get();

    if (!doc.exists) {
      throw new NotFoundError('Visit not found');
    }

    return doc.data() as Visit;
  }

  /**
   * Update visit
   */
  async updateVisit(visitId: string, data: UpdateVisitData): Promise<Visit> {
    const visit = await this.getVisitById(visitId);

    const updatedVisit: Visit = {
      ...visit,
      ...data,
      updatedAt: new Date()
    };

    await collections.visits.doc(visitId).set(updatedVisit, { merge: true });

    return updatedVisit;
  }

  /**
   * Start a scheduled visit
   */
  async startVisit(visitId: string): Promise<Visit> {
    const visit = await this.getVisitById(visitId);

    if (visit.status !== VisitStatus.SCHEDULED) {
      throw new BadRequestError('Only scheduled visits can be started');
    }

    return this.updateVisit(visitId, { status: VisitStatus.IN_PROGRESS });
  }

  /**
   * Complete a visit
   */
  async completeVisit(
    visitId: string,
    diagnosis?: Diagnosis,
    notes?: string,
    followUpDate?: Date
  ): Promise<Visit> {
    const visit = await this.getVisitById(visitId);

    if (visit.status !== VisitStatus.IN_PROGRESS) {
      throw new BadRequestError('Only in-progress visits can be completed');
    }

    const updatedVisit = await this.updateVisit(visitId, {
      status: VisitStatus.COMPLETED,
      diagnosis,
      notes: notes || visit.notes,
      followUpDate
    });

    // Decrement doctor's patient count
    const doctor = await doctorService.getDoctorById(visit.doctorId);
    if (doctor.currentPatientCount > 0) {
      await collections.doctors.doc(visit.doctorId).set({
        currentPatientCount: doctor.currentPatientCount - 1
      }, { merge: true });
    }

    return updatedVisit;
  }

  /**
   * Cancel a visit
   */
  async cancelVisit(visitId: string, reason?: string): Promise<Visit> {
    const visit = await this.getVisitById(visitId);

    if (visit.status === VisitStatus.COMPLETED) {
      throw new BadRequestError('Cannot cancel a completed visit');
    }

    const updatedVisit = await this.updateVisit(visitId, {
      status: VisitStatus.CANCELLED,
      notes: reason ? `${visit.notes}\nCancellation reason: ${reason}` : visit.notes
    });

    // If visit was in progress, decrement doctor's patient count
    if (visit.status === VisitStatus.IN_PROGRESS) {
      const doctor = await doctorService.getDoctorById(visit.doctorId);
      if (doctor.currentPatientCount > 0) {
        await collections.doctors.doc(visit.doctorId).set({
          currentPatientCount: doctor.currentPatientCount - 1
        }, { merge: true });
      }
    }

    return updatedVisit;
  }

  /**
   * Record vital signs for a visit
   */
  async recordVitalSigns(visitId: string, vitalSigns: Omit<VitalSigns, 'recordedAt'>): Promise<Visit> {
    const visit = await this.getVisitById(visitId);

    if (visit.status !== VisitStatus.IN_PROGRESS) {
      throw new BadRequestError('Can only record vitals for in-progress visits');
    }

    return this.updateVisit(visitId, {
      vitalSigns: {
        ...vitalSigns,
        recordedAt: new Date()
      }
    });
  }

  /**
   * Add diagnosis to visit
   */
  async addDiagnosis(visitId: string, diagnosis: Diagnosis): Promise<Visit> {
    const visit = await this.getVisitById(visitId);

    if (visit.status !== VisitStatus.IN_PROGRESS) {
      throw new BadRequestError('Can only add diagnosis to in-progress visits');
    }

    return this.updateVisit(visitId, { diagnosis });
  }

  /**
   * Get visits for a hospital on a specific date
   */
  async getHospitalVisits(
    hospitalId: string,
    date?: Date,
    status?: VisitStatus,
    page?: number,
    limit?: number
  ): Promise<{ visits: Visit[]; total: number }> {
    const { page: p, limit: l, offset } = parsePagination(page, limit);

    let query = collections.visits.where('hospitalId', '==', hospitalId);

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query = query.where('createdAt', '>=', startOfDay).where('createdAt', '<=', endOfDay);
    }

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

    const visits = snapshot.docs.map(doc => doc.data() as Visit);

    return { visits, total };
  }

  /**
   * Get doctor's visits for today
   */
  async getDoctorTodayVisits(doctorId: string): Promise<Visit[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const snapshot = await collections.visits
      .where('doctorId', '==', doctorId)
      .where('createdAt', '>=', startOfDay)
      .where('createdAt', '<=', endOfDay)
      .orderBy('createdAt', 'asc')
      .get();

    return snapshot.docs.map(doc => doc.data() as Visit);
  }

  /**
   * Get visit with full details (patient, doctor info)
   */
  async getVisitWithDetails(visitId: string): Promise<{
    visit: Visit;
    patient: {
      id: string;
      healthId: string;
      firstName: string;
      lastName: string;
      allergies: string[];
      chronicConditions: string[];
    };
    doctor: {
      id: string;
      firstName: string;
      lastName: string;
      specialization: string;
    };
  }> {
    const visit = await this.getVisitById(visitId);

    const [patient, doctor] = await Promise.all([
      patientService.getPatientById(visit.patientId),
      doctorService.getDoctorById(visit.doctorId)
    ]);

    return {
      visit,
      patient: {
        id: patient.id,
        healthId: patient.healthId,
        firstName: patient.firstName,
        lastName: patient.lastName,
        allergies: patient.allergies,
        chronicConditions: patient.chronicConditions
      },
      doctor: {
        id: doctor.id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        specialization: doctor.specialization
      }
    };
  }
}

export const visitService = new VisitService();
