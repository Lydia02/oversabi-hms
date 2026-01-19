import { collections } from '../config/firebase.js';
import {
  MedicalReport,
  MedicalReportStatus,
  User,
  VitalSigns,
  Medication
} from '../types/index.js';
import { generateId } from '../utils/helpers.js';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError
} from '../utils/errors.js';

interface CreateMedicalReportData {
  patientUniqueId: string;
  title: string;
  chiefComplaint: string;
  presentIllness: string;
  pastMedicalHistory?: string;
  familyHistory?: string;
  socialHistory?: string;
  physicalExamination?: string;
  vitalSigns?: VitalSigns;
  diagnosis: string;
  diagnosisCode?: string;
  treatment: string;
  medications?: Medication[];
  labResults?: string;
  imaging?: string;
  recommendations?: string;
  followUpDate?: Date;
  status?: MedicalReportStatus;
}

interface UpdateMedicalReportData {
  title?: string;
  chiefComplaint?: string;
  presentIllness?: string;
  pastMedicalHistory?: string;
  familyHistory?: string;
  socialHistory?: string;
  physicalExamination?: string;
  vitalSigns?: VitalSigns;
  diagnosis?: string;
  diagnosisCode?: string;
  treatment?: string;
  medications?: Medication[];
  labResults?: string;
  imaging?: string;
  recommendations?: string;
  followUpDate?: Date;
  status?: MedicalReportStatus;
}

class MedicalReportService {
  /**
   * Get patient by unique ID (PAT_XXX)
   */
  private async getPatientByUniqueId(uniqueId: string): Promise<User> {
    const snapshot = await collections.users
      .where('uniqueId', '==', uniqueId.toUpperCase())
      .where('role', '==', 'patient')
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new NotFoundError(`Patient with ID ${uniqueId} not found`);
    }

    return snapshot.docs[0].data() as User;
  }

  /**
   * Get doctor by user ID
   */
  private async getDoctorByUserId(userId: string): Promise<User> {
    const userDoc = await collections.users.doc(userId).get();

    if (!userDoc.exists) {
      throw new NotFoundError('Doctor not found');
    }

    const user = userDoc.data() as User;

    if (user.role !== 'doctor') {
      throw new ForbiddenError('Only doctors can perform this action');
    }

    return user;
  }

  /**
   * Create a new medical report
   */
  async createReport(
    doctorUserId: string,
    data: CreateMedicalReportData
  ): Promise<MedicalReport> {
    // Get doctor details
    const doctor = await this.getDoctorByUserId(doctorUserId);

    // Get patient details
    const patient = await this.getPatientByUniqueId(data.patientUniqueId);

    const now = new Date();
    const reportId = generateId();

    const patientFullName = [patient.firstName, patient.otherName, patient.lastName]
      .filter(Boolean)
      .join(' ');

    const doctorFullName = [doctor.firstName, doctor.otherName, doctor.lastName]
      .filter(Boolean)
      .join(' ');

    const report: MedicalReport = {
      id: reportId,
      patientId: patient.id,
      patientUniqueId: patient.uniqueId,
      patientName: patientFullName,
      doctorId: doctor.id,
      doctorUniqueId: doctor.uniqueId,
      doctorName: `Dr. ${doctorFullName}`,
      hospitalName: doctor.hospitalName || 'Unknown Hospital',

      title: data.title,
      chiefComplaint: data.chiefComplaint,
      presentIllness: data.presentIllness,
      pastMedicalHistory: data.pastMedicalHistory,
      familyHistory: data.familyHistory,
      socialHistory: data.socialHistory,

      physicalExamination: data.physicalExamination,
      vitalSigns: data.vitalSigns,

      diagnosis: data.diagnosis,
      diagnosisCode: data.diagnosisCode,
      treatment: data.treatment,
      medications: data.medications,

      labResults: data.labResults,
      imaging: data.imaging,
      recommendations: data.recommendations,
      followUpDate: data.followUpDate,

      status: data.status || MedicalReportStatus.FINAL,

      createdAt: now,
      updatedAt: now
    };

    await collections.medicalReports.doc(reportId).set(report);

    return report;
  }

  /**
   * Update an existing medical report
   * Only the doctor who created it can update it
   */
  async updateReport(
    doctorUserId: string,
    reportId: string,
    data: UpdateMedicalReportData
  ): Promise<MedicalReport> {
    const reportDoc = await collections.medicalReports.doc(reportId).get();

    if (!reportDoc.exists) {
      throw new NotFoundError('Medical report not found');
    }

    const report = reportDoc.data() as MedicalReport;

    // Check if the doctor is the one who created the report
    if (report.doctorId !== doctorUserId) {
      throw new ForbiddenError('You can only edit reports you created');
    }

    const doctor = await this.getDoctorByUserId(doctorUserId);
    const doctorFullName = [doctor.firstName, doctor.otherName, doctor.lastName]
      .filter(Boolean)
      .join(' ');

    const now = new Date();
    const updateData: Partial<MedicalReport> = {
      ...data,
      status: data.status || MedicalReportStatus.AMENDED,
      lastEditedBy: `Dr. ${doctorFullName}`,
      lastEditedAt: now,
      updatedAt: now
    };

    await collections.medicalReports.doc(reportId).set(updateData, { merge: true });

    return {
      ...report,
      ...updateData
    } as MedicalReport;
  }

  /**
   * Delete a medical report
   * Only the doctor who created it can delete it
   */
  async deleteReport(doctorUserId: string, reportId: string): Promise<void> {
    const reportDoc = await collections.medicalReports.doc(reportId).get();

    if (!reportDoc.exists) {
      throw new NotFoundError('Medical report not found');
    }

    const report = reportDoc.data() as MedicalReport;

    // Check if the doctor is the one who created the report
    if (report.doctorId !== doctorUserId) {
      throw new ForbiddenError('You can only delete reports you created');
    }

    await collections.medicalReports.doc(reportId).delete();
  }

  /**
   * Get a specific medical report by ID
   */
  async getReportById(reportId: string): Promise<MedicalReport> {
    const reportDoc = await collections.medicalReports.doc(reportId).get();

    if (!reportDoc.exists) {
      throw new NotFoundError('Medical report not found');
    }

    return reportDoc.data() as MedicalReport;
  }

  /**
   * Search for patient and get their medical reports (for doctors)
   */
  async searchPatientReports(
    patientUniqueId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ reports: MedicalReport[]; total: number; patient: Omit<User, 'passwordHash'> }> {
    // Get patient details
    const patient = await this.getPatientByUniqueId(patientUniqueId);

    // Get total count
    const countSnapshot = await collections.medicalReports
      .where('patientUniqueId', '==', patientUniqueId.toUpperCase())
      .get();

    const total = countSnapshot.size;

    // Get paginated reports
    const snapshot = await collections.medicalReports
      .where('patientUniqueId', '==', patientUniqueId.toUpperCase())
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset((page - 1) * limit)
      .get();

    const reports = snapshot.docs.map(doc => doc.data() as MedicalReport);

    const { passwordHash: _, ...patientWithoutPassword } = patient;

    return {
      reports,
      total,
      patient: patientWithoutPassword
    };
  }

  /**
   * Get all reports created by a specific doctor
   */
  async getDoctorReports(
    doctorUserId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ reports: MedicalReport[]; total: number }> {
    // Get total count
    const countSnapshot = await collections.medicalReports
      .where('doctorId', '==', doctorUserId)
      .get();

    const total = countSnapshot.size;

    // Get paginated reports
    const snapshot = await collections.medicalReports
      .where('doctorId', '==', doctorUserId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset((page - 1) * limit)
      .get();

    const reports = snapshot.docs.map(doc => doc.data() as MedicalReport);

    return { reports, total };
  }

  /**
   * Get all reports for a patient (for patient view)
   */
  async getPatientOwnReports(
    patientUserId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ reports: MedicalReport[]; total: number }> {
    // Verify user is a patient
    const userDoc = await collections.users.doc(patientUserId).get();

    if (!userDoc.exists) {
      throw new NotFoundError('User not found');
    }

    const user = userDoc.data() as User;

    if (user.role !== 'patient') {
      throw new ForbiddenError('Only patients can view their own reports');
    }

    // Get total count
    const countSnapshot = await collections.medicalReports
      .where('patientId', '==', patientUserId)
      .get();

    const total = countSnapshot.size;

    // Get paginated reports
    const snapshot = await collections.medicalReports
      .where('patientId', '==', patientUserId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset((page - 1) * limit)
      .get();

    const reports = snapshot.docs.map(doc => doc.data() as MedicalReport);

    return { reports, total };
  }

  /**
   * Get a single report for patient (verify ownership)
   */
  async getPatientReportById(
    patientUserId: string,
    reportId: string
  ): Promise<MedicalReport> {
    const report = await this.getReportById(reportId);

    if (report.patientId !== patientUserId) {
      throw new ForbiddenError('You can only view your own medical reports');
    }

    return report;
  }
}

export const medicalReportService = new MedicalReportService();
