import bcrypt from 'bcryptjs';
import { collections } from '../config/firebase.js';
import { User, UserRole, MedicalReport, MedicalReportStatus } from '../types/index.js';
import { generateId } from '../utils/helpers.js';

// 10 Nigerian patients with common health conditions
const SAMPLE_PATIENTS = [
  {
    firstName: 'Chidinma',
    lastName: 'Okonkwo',
    otherName: 'Grace',
    age: 32,
    email: 'chidinma.okonkwo@gmail.com',
    phoneNumber: '+2348012345601',
    uniqueId: 'PAT_101',
    condition: 'Malaria and Typhoid'
  },
  {
    firstName: 'Oluwaseun',
    lastName: 'Adeyemi',
    otherName: 'David',
    age: 45,
    email: 'seun.adeyemi@yahoo.com',
    phoneNumber: '+2348023456702',
    uniqueId: 'PAT_102',
    condition: 'Hypertension'
  },
  {
    firstName: 'Amina',
    lastName: 'Bello',
    otherName: undefined,
    age: 28,
    email: 'amina.bello@gmail.com',
    phoneNumber: '+2348034567803',
    uniqueId: 'PAT_103',
    condition: 'Diabetes Type 2'
  },
  {
    firstName: 'Chukwuemeka',
    lastName: 'Eze',
    otherName: 'Michael',
    age: 55,
    email: 'emeka.eze@outlook.com',
    phoneNumber: '+2348045678904',
    uniqueId: 'PAT_104',
    condition: 'Arthritis'
  },
  {
    firstName: 'Folake',
    lastName: 'Ogundimu',
    otherName: 'Elizabeth',
    age: 38,
    email: 'folake.ogundimu@gmail.com',
    phoneNumber: '+2348056789005',
    uniqueId: 'PAT_105',
    condition: 'Asthma'
  },
  {
    firstName: 'Ibrahim',
    lastName: 'Musa',
    otherName: 'Abdullahi',
    age: 62,
    email: 'ibrahim.musa@yahoo.com',
    phoneNumber: '+2348067890106',
    uniqueId: 'PAT_106',
    condition: 'Chronic Back Pain'
  },
  {
    firstName: 'Ngozi',
    lastName: 'Nnamdi',
    otherName: 'Patricia',
    age: 25,
    email: 'ngozi.nnamdi@gmail.com',
    phoneNumber: '+2348078901207',
    uniqueId: 'PAT_107',
    condition: 'Peptic Ulcer'
  },
  {
    firstName: 'Tunde',
    lastName: 'Bakare',
    otherName: 'Joseph',
    age: 41,
    email: 'tunde.bakare@hotmail.com',
    phoneNumber: '+2348089012308',
    uniqueId: 'PAT_108',
    condition: 'High Cholesterol'
  },
  {
    firstName: 'Hauwa',
    lastName: 'Suleiman',
    otherName: undefined,
    age: 35,
    email: 'hauwa.suleiman@gmail.com',
    phoneNumber: '+2348090123409',
    uniqueId: 'PAT_109',
    condition: 'Migraine'
  },
  {
    firstName: 'Obiora',
    lastName: 'Okeke',
    otherName: 'Anthony',
    age: 50,
    email: 'obiora.okeke@yahoo.com',
    phoneNumber: '+2348001234510',
    uniqueId: 'PAT_110',
    condition: 'Pneumonia'
  }
];

// Sample medical reports for patients (created by seeded doctors)
const SAMPLE_REPORTS = [
  {
    patientUniqueId: 'PAT_101',
    doctorUniqueId: 'DOC_201',
    doctorName: 'Dr. Adebayo Ogunlesi',
    hospitalName: 'Lagos University Teaching Hospital (LUTH)',
    title: 'Malaria Treatment',
    chiefComplaint: 'High fever, body weakness, and loss of appetite for 4 days',
    presentIllness: 'Patient presents with intermittent high-grade fever, chills, headache, and generalized body weakness. No vomiting or diarrhea.',
    diagnosis: 'Plasmodium falciparum Malaria with Typhoid co-infection',
    diagnosisCode: 'B50.9',
    treatment: 'Artemether-Lumefantrine combination therapy, Ciprofloxacin for typhoid, IV fluids for hydration',
    medications: [
      { name: 'Coartem', dosage: '80/480mg', frequency: 'Twice daily', duration: '3 days' },
      { name: 'Ciprofloxacin', dosage: '500mg', frequency: 'Twice daily', duration: '7 days' },
      { name: 'Paracetamol', dosage: '1000mg', frequency: 'As needed', duration: '3 days' }
    ],
    vitalSigns: { bloodPressure: '110/70', heartRate: 98, temperature: 39.2, weight: 65, height: 165, oxygenSaturation: 97, recordedAt: new Date() }
  },
  {
    patientUniqueId: 'PAT_102',
    doctorUniqueId: 'DOC_202',
    doctorName: 'Dr. Ngozi Okonkwo',
    hospitalName: 'National Hospital Abuja',
    title: 'Hypertension Management',
    chiefComplaint: 'Persistent headaches and occasional dizziness for 2 weeks',
    presentIllness: 'Patient reports frequent headaches, especially in the morning, with occasional dizziness. No chest pain or shortness of breath.',
    diagnosis: 'Essential Hypertension Stage 2',
    diagnosisCode: 'I10',
    treatment: 'Lifestyle modification, antihypertensive medication, regular BP monitoring',
    medications: [
      { name: 'Amlodipine', dosage: '10mg', frequency: 'Once daily', duration: 'Continuous' },
      { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', duration: 'Continuous' }
    ],
    vitalSigns: { bloodPressure: '165/100', heartRate: 82, temperature: 36.8, weight: 88, height: 175, oxygenSaturation: 98, recordedAt: new Date() }
  },
  {
    patientUniqueId: 'PAT_103',
    doctorUniqueId: 'DOC_201',
    doctorName: 'Dr. Adebayo Ogunlesi',
    hospitalName: 'Lagos University Teaching Hospital (LUTH)',
    title: 'Diabetes Follow-up',
    chiefComplaint: 'Routine diabetes check-up, increased thirst and frequent urination',
    presentIllness: 'Patient with known Type 2 Diabetes for 3 years. Reports increased thirst, polyuria, and occasional blurred vision.',
    diagnosis: 'Type 2 Diabetes Mellitus - Uncontrolled',
    diagnosisCode: 'E11.9',
    treatment: 'Adjust oral hypoglycemic medication, dietary counseling, blood glucose monitoring',
    medications: [
      { name: 'Metformin', dosage: '1000mg', frequency: 'Twice daily', duration: 'Continuous' },
      { name: 'Glimepiride', dosage: '2mg', frequency: 'Once daily', duration: 'Continuous' }
    ],
    vitalSigns: { bloodPressure: '130/85', heartRate: 76, temperature: 36.5, weight: 72, height: 160, oxygenSaturation: 98, recordedAt: new Date() }
  }
];

// Sample doctors to create reports
const SAMPLE_DOCTORS = [
  {
    firstName: 'Adebayo',
    lastName: 'Ogunlesi',
    otherName: 'Samuel',
    age: 45,
    email: 'dr.adebayo@luth.gov.ng',
    phoneNumber: '+2348011111101',
    uniqueId: 'DOC_201',
    mdcnNumber: 'MDCN/2020/12345',
    hospitalName: 'Lagos University Teaching Hospital (LUTH)'
  },
  {
    firstName: 'Ngozi',
    lastName: 'Okonkwo',
    otherName: 'Catherine',
    age: 42,
    email: 'dr.ngozi@nha.gov.ng',
    phoneNumber: '+2348022222202',
    uniqueId: 'DOC_202',
    mdcnNumber: 'MDCN/2019/67890',
    hospitalName: 'National Hospital Abuja'
  }
];

class SeedService {
  /**
   * Seed the database with sample Nigerian patients
   */
  async seedPatients(): Promise<{ message: string; count: number; patients: { uniqueId: string; name: string; email: string }[] }> {
    const seededPatients: { uniqueId: string; name: string; email: string }[] = [];
    const defaultPassword = 'Password123!';
    const passwordHash = await bcrypt.hash(defaultPassword, 12);
    const now = new Date();

    for (const patient of SAMPLE_PATIENTS) {
      // Check if patient already exists
      const existingByUniqueId = await collections.users
        .where('uniqueId', '==', patient.uniqueId)
        .limit(1)
        .get();

      if (!existingByUniqueId.empty) {
        continue; // Skip if already exists
      }

      const existingByEmail = await collections.users
        .where('email', '==', patient.email)
        .limit(1)
        .get();

      if (!existingByEmail.empty) {
        continue; // Skip if email already exists
      }

      const userId = generateId();
      const user: User = {
        id: userId,
        uniqueId: patient.uniqueId,
        firstName: patient.firstName,
        lastName: patient.lastName,
        otherName: patient.otherName,
        age: patient.age,
        email: patient.email,
        phoneNumber: patient.phoneNumber,
        passwordHash,
        role: UserRole.PATIENT,
        isVerified: true,
        isActive: true,
        createdAt: now,
        updatedAt: now
      };

      await collections.users.doc(userId).set(user);

      seededPatients.push({
        uniqueId: patient.uniqueId,
        name: `${patient.firstName} ${patient.lastName}`,
        email: patient.email
      });
    }

    return {
      message: seededPatients.length > 0
        ? `Seeded ${seededPatients.length} patients. Default password: ${defaultPassword}`
        : 'All patients already exist in the database',
      count: seededPatients.length,
      patients: seededPatients
    };
  }

  /**
   * Seed sample doctors for testing
   */
  async seedDoctors(): Promise<{ message: string; count: number; doctors: { uniqueId: string; name: string; email: string }[] }> {
    const seededDoctors: { uniqueId: string; name: string; email: string }[] = [];
    const defaultPassword = 'DoctorPass123!';
    const passwordHash = await bcrypt.hash(defaultPassword, 12);
    const now = new Date();

    for (const doctor of SAMPLE_DOCTORS) {
      // Check if doctor already exists
      const existingByUniqueId = await collections.users
        .where('uniqueId', '==', doctor.uniqueId)
        .limit(1)
        .get();

      if (!existingByUniqueId.empty) {
        continue;
      }

      const userId = generateId();
      const user: User = {
        id: userId,
        uniqueId: doctor.uniqueId,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        otherName: doctor.otherName,
        age: doctor.age,
        email: doctor.email,
        phoneNumber: doctor.phoneNumber,
        passwordHash,
        role: UserRole.DOCTOR,
        mdcnNumber: doctor.mdcnNumber,
        hospitalName: doctor.hospitalName,
        isVerified: true,
        isActive: true,
        createdAt: now,
        updatedAt: now
      };

      await collections.users.doc(userId).set(user);

      seededDoctors.push({
        uniqueId: doctor.uniqueId,
        name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
        email: doctor.email
      });
    }

    return {
      message: seededDoctors.length > 0
        ? `Seeded ${seededDoctors.length} doctors. Default password: ${defaultPassword}`
        : 'All doctors already exist in the database',
      count: seededDoctors.length,
      doctors: seededDoctors
    };
  }

  /**
   * Seed sample medical reports
   */
  async seedMedicalReports(): Promise<{ message: string; count: number }> {
    let count = 0;
    const now = new Date();

    for (const reportData of SAMPLE_REPORTS) {
      // Find the patient
      const patientSnapshot = await collections.users
        .where('uniqueId', '==', reportData.patientUniqueId)
        .limit(1)
        .get();

      if (patientSnapshot.empty) continue;

      const patient = patientSnapshot.docs[0].data() as User;

      // Find the doctor
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

      if (!existingReport.empty) continue;

      const reportId = generateId();
      const report: MedicalReport = {
        id: reportId,
        patientId: patient.id,
        patientUniqueId: patient.uniqueId,
        patientName: `${patient.firstName} ${patient.lastName}`,
        doctorId: doctor.id,
        doctorUniqueId: doctor.uniqueId,
        doctorName: reportData.doctorName,
        hospitalName: reportData.hospitalName,
        title: reportData.title,
        chiefComplaint: reportData.chiefComplaint,
        presentIllness: reportData.presentIllness,
        diagnosis: reportData.diagnosis,
        diagnosisCode: reportData.diagnosisCode,
        treatment: reportData.treatment,
        medications: reportData.medications,
        vitalSigns: reportData.vitalSigns,
        status: MedicalReportStatus.FINAL,
        createdAt: now,
        updatedAt: now
      };

      await collections.medicalReports.doc(reportId).set(report);
      count++;
    }

    return {
      message: count > 0 ? `Seeded ${count} medical reports` : 'All medical reports already exist',
      count
    };
  }

  /**
   * Seed all sample data (patients, doctors, and reports)
   */
  async seedAll(): Promise<{
    patients: { message: string; count: number };
    doctors: { message: string; count: number };
    reports: { message: string; count: number };
    credentials: { patientPassword: string; doctorPassword: string };
  }> {
    const patients = await this.seedPatients();
    const doctors = await this.seedDoctors();
    const reports = await this.seedMedicalReports();

    return {
      patients: { message: patients.message, count: patients.count },
      doctors: { message: doctors.message, count: doctors.count },
      reports: { message: reports.message, count: reports.count },
      credentials: {
        patientPassword: 'Password123!',
        doctorPassword: 'DoctorPass123!'
      }
    };
  }

  /**
   * Get list of sample patient credentials for testing
   */
  getSamplePatientCredentials(): { uniqueId: string; name: string; email: string; password: string; condition: string }[] {
    return SAMPLE_PATIENTS.map(p => ({
      uniqueId: p.uniqueId,
      name: `${p.firstName} ${p.lastName}`,
      email: p.email,
      password: 'Password123!',
      condition: p.condition
    }));
  }

  /**
   * Get list of sample doctor credentials for testing
   */
  getSampleDoctorCredentials(): { uniqueId: string; name: string; email: string; password: string; hospital: string }[] {
    return SAMPLE_DOCTORS.map(d => ({
      uniqueId: d.uniqueId,
      name: `Dr. ${d.firstName} ${d.lastName}`,
      email: d.email,
      password: 'DoctorPass123!',
      hospital: d.hospitalName
    }));
  }
}

export const seedService = new SeedService();
