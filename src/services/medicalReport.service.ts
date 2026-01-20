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

// Sample medical records for verification
const SAMPLE_MEDICAL_REPORTS: Omit<MedicalReport, 'id' | 'patientId' | 'doctorId'>[] = [
  {
    patientUniqueId: 'PAT_101',
    doctorUniqueId: 'DOC_201',
    patientName: 'Chidinma Okonkwo',
    doctorName: 'Dr. Adebayo Ogunlesi',
    hospitalName: 'Lagos University Teaching Hospital (LUTH)',
    title: 'Malaria Treatment',
    chiefComplaint: 'High fever, body weakness, and loss of appetite for 4 days',
    presentIllness: 'Patient presents with intermittent high-grade fever, chills, headache, and generalized body weakness',
    pastMedicalHistory: 'Recurrent malaria infections',
    familyHistory: 'Mother had malaria',
    socialHistory: 'Lives in Lagos, exposed to mosquitoes',
    physicalExamination: 'BP: 110/70 mmHg, HR: 98 bpm, Temp: 39.2°C',
    vitalSigns: {
      bloodPressure: '110/70',
      heartRate: 98,
      temperature: 39.2,
      oxygenSaturation: 97,
      recordedAt: new Date('2026-01-18')
    },
    diagnosis: 'Plasmodium falciparum Malaria',
    diagnosisCode: 'B50.9',
    treatment: 'Artemether-Lumefantrine combination therapy, IV fluids for hydration',
    medications: [
      {
        name: 'Coartem',
        dosage: '80/480mg',
        frequency: 'Twice daily',
        duration: '3 days'
      },
      {
        name: 'Paracetamol',
        dosage: '1000mg',
        frequency: 'As needed',
        duration: '3 days'
      }
    ],
    labResults: 'Blood test positive for malaria parasites',
    recommendations: 'Complete full course of treatment, avoid mosquito exposure, use insecticide-treated nets',
    followUpDate: new Date('2026-01-25'),
    status: MedicalReportStatus.FINAL,
    createdAt: new Date('2026-01-18'),
    updatedAt: new Date('2026-01-18')
  },
  {
    patientUniqueId: 'PAT_102',
    doctorUniqueId: 'DOC_202',
    patientName: 'Oluwaseun Adeyemi',
    doctorName: 'Dr. Ngozi Okonkwo',
    hospitalName: 'National Hospital Abuja',
    title: 'Hypertension Management',
    chiefComplaint: 'Persistent headaches and occasional dizziness for 2 weeks',
    presentIllness: 'Patient reports frequent headaches, especially in the morning, with occasional dizziness',
    pastMedicalHistory: 'Essential hypertension diagnosed 5 years ago',
    familyHistory: 'Father had hypertension',
    socialHistory: 'Office worker, occasional alcohol use',
    physicalExamination: 'BP: 165/100 mmHg, HR: 82 bpm, alert and oriented',
    vitalSigns: {
      bloodPressure: '165/100',
      heartRate: 82,
      temperature: 36.8,
      oxygenSaturation: 98,
      recordedAt: new Date('2026-01-18')
    },
    diagnosis: 'Essential Hypertension Stage 2',
    diagnosisCode: 'I10',
    treatment: 'Adjust antihypertensive medication, dietary counseling, lifestyle modification',
    medications: [
      {
        name: 'Amlodipine',
        dosage: '10mg',
        frequency: 'Once daily',
        duration: 'Continuous'
      },
      {
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        duration: 'Continuous'
      }
    ],
    labResults: 'Electrolytes normal, Creatinine 0.95 mg/dL',
    recommendations: 'Reduce salt intake, exercise 30 mins daily, continue medications',
    followUpDate: new Date('2026-02-18'),
    status: MedicalReportStatus.FINAL,
    createdAt: new Date('2026-01-18'),
    updatedAt: new Date('2026-01-18')
  },
  {
    patientUniqueId: 'PAT_103',
    doctorUniqueId: 'DOC_201',
    patientName: 'Amina Bello',
    doctorName: 'Dr. Adebayo Ogunlesi',
    hospitalName: 'Lagos University Teaching Hospital (LUTH)',
    title: 'Diabetes Follow-up',
    chiefComplaint: 'Routine diabetes check-up, increased thirst and frequent urination',
    presentIllness: 'Patient with known Type 2 Diabetes for 3 years. Reports increased thirst, polyuria',
    pastMedicalHistory: 'Type 2 Diabetes Mellitus diagnosed 3 years ago',
    familyHistory: 'Father diabetic, mother hypertensive',
    socialHistory: 'Sedentary lifestyle, high stress',
    physicalExamination: 'BP: 130/85 mmHg, HR: 76 bpm, weight 72 kg',
    vitalSigns: {
      bloodPressure: '130/85',
      heartRate: 76,
      temperature: 36.5,
      oxygenSaturation: 98,
      recordedAt: new Date('2026-01-18')
    },
    diagnosis: 'Type 2 Diabetes Mellitus - Uncontrolled',
    diagnosisCode: 'E11.9',
    treatment: 'Adjust oral hypoglycemic medication, dietary counseling, blood glucose monitoring',
    medications: [
      {
        name: 'Metformin',
        dosage: '1000mg',
        frequency: 'Twice daily',
        duration: 'Continuous'
      },
      {
        name: 'Glimepiride',
        dosage: '2mg',
        frequency: 'Once daily',
        duration: 'Continuous'
      }
    ],
    labResults: 'FBS: 145 mg/dL, HbA1c: 7.8%',
    recommendations: 'Increase exercise, reduce carbohydrates, monthly glucose monitoring',
    followUpDate: new Date('2026-02-18'),
    status: MedicalReportStatus.FINAL,
    createdAt: new Date('2026-01-18'),
    updatedAt: new Date('2026-01-18')
  },
  {
    patientUniqueId: 'PAT_104',
    doctorUniqueId: 'DOC_201',
    patientName: 'Chukwuemeka Eze',
    doctorName: 'Dr. Adebayo Ogunlesi',
    hospitalName: 'Lagos University Teaching Hospital (LUTH)',
    title: 'Arthritis Assessment',
    chiefComplaint: 'Joint pain and stiffness in hands and knees for 6 months',
    presentIllness: 'Progressive joint pain, worse in the morning, limiting activities',
    pastMedicalHistory: 'No significant past medical history',
    familyHistory: 'Mother has osteoarthritis',
    socialHistory: 'Manual worker, high physical activity',
    physicalExamination: 'Swelling in both knees, restricted range of motion, tenderness on palpation',
    vitalSigns: {
      bloodPressure: '128/80',
      heartRate: 74,
      temperature: 36.6,
      oxygenSaturation: 98,
      recordedAt: new Date('2026-01-18')
    },
    diagnosis: 'Osteoarthritis of knees',
    diagnosisCode: 'M17.11',
    treatment: 'Physical therapy, NSAIDs, weight management, joint protection',
    medications: [
      {
        name: 'Ibuprofen',
        dosage: '400mg',
        frequency: 'Three times daily',
        duration: 'Continuous'
      }
    ],
    labResults: 'ESR: 18 mm/hr, CRP: normal',
    imaging: 'X-ray knees: Degenerative changes, bone spurs visible',
    recommendations: 'Physical therapy 2x weekly, weight reduction, avoid heavy lifting',
    followUpDate: new Date('2026-03-18'),
    status: MedicalReportStatus.FINAL,
    createdAt: new Date('2026-01-18'),
    updatedAt: new Date('2026-01-18')
  },
  {
    patientUniqueId: 'PAT_105',
    doctorUniqueId: 'DOC_202',
    patientName: 'Folake Ogundimu',
    doctorName: 'Dr. Ngozi Okonkwo',
    hospitalName: 'National Hospital Abuja',
    title: 'Asthma Control Review',
    chiefComplaint: 'Shortness of breath and wheezing episodes',
    presentIllness: 'Asthma exacerbations 2-3 times per week, particularly at night',
    pastMedicalHistory: 'Asthma diagnosed 8 years ago',
    familyHistory: 'Father has asthma',
    socialHistory: 'Non-smoker, no occupational exposure',
    physicalExamination: 'Bilateral wheezes on auscultation, no accessory muscle use',
    vitalSigns: {
      bloodPressure: '125/80',
      heartRate: 86,
      temperature: 36.7,
      oxygenSaturation: 96,
      recordedAt: new Date('2026-01-18')
    },
    diagnosis: 'Asthma - partially controlled',
    diagnosisCode: 'J45.901',
    treatment: 'Increase inhaled corticosteroid dose, add long-acting beta agonist',
    medications: [
      {
        name: 'Salbutamol',
        dosage: '100mcg',
        frequency: 'As needed',
        duration: 'Continuous'
      },
      {
        name: 'Beclomethasone',
        dosage: '250mcg',
        frequency: 'Twice daily',
        duration: 'Continuous'
      }
    ],
    labResults: 'FEV1: 72% predicted',
    imaging: 'Chest X-ray: Normal',
    recommendations: 'Asthma action plan, allergen avoidance, monthly follow-up',
    followUpDate: new Date('2026-02-18'),
    status: MedicalReportStatus.FINAL,
    createdAt: new Date('2026-01-18'),
    updatedAt: new Date('2026-01-18')
  }
];

class MedicalReportService {
  /**
   * Seed the database with sample medical reports
   */
  async seedMedicalReports(): Promise<{ message: string; count: number }> {
    const batch = collections.medicalReports.firestore.batch();
    let count = 0;

    for (const reportData of SAMPLE_MEDICAL_REPORTS) {
      // Find the patient by unique ID
      const patientSnapshot = await collections.users
        .where('uniqueId', '==', reportData.patientUniqueId)
        .limit(1)
        .get();

      if (patientSnapshot.empty) continue;

      const patient = patientSnapshot.docs[0].data() as User;

      // Find the doctor by unique ID
      const doctorSnapshot = await collections.users
        .where('uniqueId', '==', reportData.doctorUniqueId)
        .limit(1)
        .get();

      if (doctorSnapshot.empty) continue;

      const doctor = doctorSnapshot.docs[0].data() as User;

      // Check if report already exists for this patient with same title
      const existingReport = await collections.medicalReports
        .where('patientUniqueId', '==', reportData.patientUniqueId)
        .where('title', '==', reportData.title)
        .limit(1)
        .get();

      if (existingReport.empty) {
        const reportId = generateId();
        const docRef = collections.medicalReports.doc(reportId);
        batch.set(docRef, {
          id: reportId,
          patientId: patient.id,
          doctorId: doctor.id,
          ...reportData
        });
        count++;
      }
    }

    if (count > 0) {
      await batch.commit();
    }

    return {
      message: count > 0 ? `Seeded ${count} medical reports` : 'Medical reports already exist',
      count
    };
  }

  /**
   * Get sample medical report IDs (for testing/demo purposes)
   */
  getSampleReportIds(): string[] {
    return SAMPLE_MEDICAL_REPORTS.map((_, index) => `MR_${String(index + 1).padStart(3, '0')}`);
  }

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
