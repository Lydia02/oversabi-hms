import { collections } from '../config/firebase.js';
import {
  Doctor,
  DoctorAvailability,
  Patient,
  Visit,
  VisitStatus,
  Referral,
  ReferralStatus,
  Severity
} from '../types/index.js';
import { generateId, parsePagination } from '../utils/helpers.js';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors.js';

export interface CreateDoctorData {
  userId: string;
  hospitalId: string;
  firstName: string;
  lastName: string;
  specialization: string;
  department: string;
  licenseNumber: string;
  phoneNumber: string;
  email: string;
  maxPatients?: number;
}

export interface UpdateDoctorData {
  specialization?: string;
  department?: string;
  availability?: DoctorAvailability;
  maxPatients?: number;
}

export class DoctorService {
  /**
   * Create a new doctor profile
   */
  async createDoctor(data: CreateDoctorData): Promise<Doctor> {
    // Check if doctor with same license number exists
    const existing = await collections.doctors
      .where('licenseNumber', '==', data.licenseNumber)
      .limit(1)
      .get();

    if (!existing.empty) {
      throw new ConflictError('Doctor with this license number already exists');
    }

    const doctorId = generateId();
    const now = new Date();

    const doctor: Doctor = {
      id: doctorId,
      userId: data.userId,
      hospitalId: data.hospitalId,
      firstName: data.firstName,
      lastName: data.lastName,
      specialization: data.specialization,
      department: data.department,
      licenseNumber: data.licenseNumber,
      phoneNumber: data.phoneNumber,
      email: data.email,
      availability: DoctorAvailability.AVAILABLE,
      maxPatients: data.maxPatients || 20,
      currentPatientCount: 0,
      createdAt: now,
      updatedAt: now
    };

    await collections.doctors.doc(doctorId).set(doctor);

    return doctor;
  }

  /**
   * Get doctor by ID
   */
  async getDoctorById(doctorId: string): Promise<Doctor> {
    const doc = await collections.doctors.doc(doctorId).get();

    if (!doc.exists) {
      throw new NotFoundError('Doctor not found');
    }

    return doc.data() as Doctor;
  }

  /**
   * Get doctor by user ID
   */
  async getDoctorByUserId(userId: string): Promise<Doctor> {
    const snapshot = await collections.doctors
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new NotFoundError('Doctor profile not found');
    }

    return snapshot.docs[0].data() as Doctor;
  }

  /**
   * Update doctor information
   */
  async updateDoctor(doctorId: string, data: UpdateDoctorData): Promise<Doctor> {
    const doctor = await this.getDoctorById(doctorId);

    const updatedDoctor: Doctor = {
      ...doctor,
      ...data,
      updatedAt: new Date()
    };

    await collections.doctors.doc(doctorId).set(updatedDoctor, { merge: true });

    return updatedDoctor;
  }

  /**
   * Set doctor availability
   */
  async setAvailability(doctorId: string, availability: DoctorAvailability): Promise<Doctor> {
    return this.updateDoctor(doctorId, { availability });
  }

  /**
   * Get all doctors in a hospital
   */
  async getDoctorsByHospital(
    hospitalId: string,
    page?: number,
    limit?: number
  ): Promise<{ doctors: Doctor[]; total: number }> {
    const { page: p, limit: l, offset } = parsePagination(page, limit);

    const countSnapshot = await collections.doctors
      .where('hospitalId', '==', hospitalId)
      .count()
      .get();
    const total = countSnapshot.data().count;

    const snapshot = await collections.doctors
      .where('hospitalId', '==', hospitalId)
      .offset(offset)
      .limit(l)
      .get();

    const doctors = snapshot.docs.map(doc => doc.data() as Doctor);

    return { doctors, total };
  }

  /**
   * Get doctors by department
   */
  async getDoctorsByDepartment(
    hospitalId: string,
    department: string
  ): Promise<Doctor[]> {
    const snapshot = await collections.doctors
      .where('hospitalId', '==', hospitalId)
      .where('department', '==', department)
      .get();

    return snapshot.docs.map(doc => doc.data() as Doctor);
  }

  /**
   * Get available doctors in a department
   */
  async getAvailableDoctors(
    hospitalId: string,
    department?: string
  ): Promise<Doctor[]> {
    let query = collections.doctors
      .where('hospitalId', '==', hospitalId)
      .where('availability', '==', DoctorAvailability.AVAILABLE);

    if (department) {
      query = query.where('department', '==', department);
    }

    const snapshot = await query.get();
    const doctors = snapshot.docs.map(doc => doc.data() as Doctor);

    // Filter doctors who haven't reached max patients
    return doctors.filter(doc => doc.currentPatientCount < doc.maxPatients);
  }

  /**
   * Get patients assigned to a doctor
   */
  async getDoctorPatients(
    doctorId: string,
    page?: number,
    limit?: number
  ): Promise<{ patients: Patient[]; total: number; doctor: Doctor }> {
    const { page: p, limit: l, offset } = parsePagination(page, limit);

    const doctor = await this.getDoctorById(doctorId);

    // Get active visits for this doctor
    const countSnapshot = await collections.visits
      .where('doctorId', '==', doctorId)
      .where('status', 'in', [VisitStatus.SCHEDULED, VisitStatus.IN_PROGRESS])
      .count()
      .get();
    const total = countSnapshot.data().count;

    const visitsSnapshot = await collections.visits
      .where('doctorId', '==', doctorId)
      .where('status', 'in', [VisitStatus.SCHEDULED, VisitStatus.IN_PROGRESS])
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(l)
      .get();

    const patientIds = [...new Set(visitsSnapshot.docs.map(doc => (doc.data() as Visit).patientId))];

    // Get patient details
    const patients: Patient[] = [];
    for (const patientId of patientIds) {
      const patientDoc = await collections.patients.doc(patientId).get();
      if (patientDoc.exists) {
        patients.push(patientDoc.data() as Patient);
      }
    }

    return { patients, total, doctor };
  }

  /**
   * Refer patient to another doctor
   */
  async referPatient(
    fromDoctorId: string,
    patientId: string,
    referralData: {
      toDoctorId?: string;
      toHospitalId?: string;
      toDepartment?: string;
      reason: string;
      urgency: Severity;
      notes?: string;
    }
  ): Promise<Referral> {
    // Verify from doctor exists
    await this.getDoctorById(fromDoctorId);

    // Verify patient exists
    const patientDoc = await collections.patients.doc(patientId).get();
    if (!patientDoc.exists) {
      throw new NotFoundError('Patient not found');
    }

    // If referring to specific doctor, verify they exist and are available
    if (referralData.toDoctorId) {
      const toDoctor = await this.getDoctorById(referralData.toDoctorId);
      if (toDoctor.availability !== DoctorAvailability.AVAILABLE) {
        throw new BadRequestError('Target doctor is not available');
      }
      if (toDoctor.currentPatientCount >= toDoctor.maxPatients) {
        throw new BadRequestError('Target doctor has reached maximum patient capacity');
      }
    }

    const referralId = generateId();
    const now = new Date();

    const referral: Referral = {
      id: referralId,
      patientId,
      fromDoctorId,
      toDoctorId: referralData.toDoctorId,
      toHospitalId: referralData.toHospitalId,
      toDepartment: referralData.toDepartment,
      reason: referralData.reason,
      urgency: referralData.urgency,
      status: ReferralStatus.PENDING,
      notes: referralData.notes,
      createdAt: now,
      updatedAt: now
    };

    await collections.referrals.doc(referralId).set(referral);

    return referral;
  }

  /**
   * Accept a referral
   */
  async acceptReferral(doctorId: string, referralId: string): Promise<Referral> {
    const referralDoc = await collections.referrals.doc(referralId).get();

    if (!referralDoc.exists) {
      throw new NotFoundError('Referral not found');
    }

    const referral = referralDoc.data() as Referral;

    if (referral.status !== ReferralStatus.PENDING) {
      throw new BadRequestError('Referral is no longer pending');
    }

    // Verify doctor exists and has capacity
    const doctor = await this.getDoctorById(doctorId);
    if (doctor.currentPatientCount >= doctor.maxPatients) {
      throw new BadRequestError('You have reached maximum patient capacity');
    }

    const now = new Date();
    const updatedReferral: Referral = {
      ...referral,
      toDoctorId: doctorId,
      status: ReferralStatus.ACCEPTED,
      acceptedAt: now,
      updatedAt: now
    };

    await collections.referrals.doc(referralId).set(updatedReferral, { merge: true });

    // Increment doctor's patient count
    await collections.doctors.doc(doctorId).set({
      currentPatientCount: doctor.currentPatientCount + 1
    }, { merge: true });

    return updatedReferral;
  }

  /**
   * Get pending referrals for a department or doctor
   */
  async getPendingReferrals(
    hospitalId: string,
    department?: string,
    doctorId?: string
  ): Promise<Referral[]> {
    let query = collections.referrals.where('status', '==', ReferralStatus.PENDING);

    if (doctorId) {
      query = query.where('toDoctorId', '==', doctorId);
    } else if (department) {
      query = query.where('toHospitalId', '==', hospitalId).where('toDepartment', '==', department);
    } else {
      query = query.where('toHospitalId', '==', hospitalId);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();

    return snapshot.docs.map(doc => doc.data() as Referral);
  }

  /**
   * Get doctor workload statistics
   */
  async getDoctorStats(doctorId: string): Promise<{
    totalPatients: number;
    todayVisits: number;
    pendingReferrals: number;
    completedVisitsThisWeek: number;
  }> {
    const doctor = await this.getDoctorById(doctorId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    // Today's visits
    const todaySnapshot = await collections.visits
      .where('doctorId', '==', doctorId)
      .where('createdAt', '>=', today)
      .count()
      .get();

    // Completed visits this week
    const weekSnapshot = await collections.visits
      .where('doctorId', '==', doctorId)
      .where('status', '==', VisitStatus.COMPLETED)
      .where('createdAt', '>=', weekAgo)
      .count()
      .get();

    // Pending referrals to this doctor
    const referralsSnapshot = await collections.referrals
      .where('toDoctorId', '==', doctorId)
      .where('status', '==', ReferralStatus.PENDING)
      .count()
      .get();

    return {
      totalPatients: doctor.currentPatientCount,
      todayVisits: todaySnapshot.data().count,
      pendingReferrals: referralsSnapshot.data().count,
      completedVisitsThisWeek: weekSnapshot.data().count
    };
  }
}

export const doctorService = new DoctorService();
