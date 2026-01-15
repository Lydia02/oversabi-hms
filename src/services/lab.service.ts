import { collections } from '../config/firebase.js';
import {
  LabCenter,
  LabTechnician,
  LabTest,
  LabTestStatus,
  LabResult,
  Patient
} from '../types/index.js';
import { generateId, parsePagination } from '../utils/helpers.js';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors.js';

export interface CreateLabCenterData {
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
  servicesOffered: string[];
}

export interface CreateLabTechnicianData {
  userId: string;
  labCenterId: string;
  firstName: string;
  lastName: string;
  specialization: string;
  licenseNumber: string;
}

export interface CreateLabTestData {
  visitId?: string;
  patientId: string;
  orderedBy: string;
  labCenterId?: string;
  testType: string;
  testName: string;
  notes?: string;
}

export interface LabResultData {
  values: Record<string, string | number>;
  interpretation?: string;
  attachments?: string[];
  verifiedBy: string;
}

export class LabService {
  /**
   * Create a new lab center
   */
  async createLabCenter(data: CreateLabCenterData): Promise<LabCenter> {
    // Check if lab center with same license number exists
    const existing = await collections.labCenters
      .where('licenseNumber', '==', data.licenseNumber)
      .limit(1)
      .get();

    if (!existing.empty) {
      throw new ConflictError('Lab center with this license number already exists');
    }

    const labCenterId = generateId();
    const now = new Date();

    const labCenter: LabCenter = {
      id: labCenterId,
      name: data.name,
      hospitalId: data.hospitalId,
      address: data.address,
      phoneNumber: data.phoneNumber,
      licenseNumber: data.licenseNumber,
      servicesOffered: data.servicesOffered,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    await collections.labCenters.doc(labCenterId).set(labCenter);

    return labCenter;
  }

  /**
   * Get lab center by ID
   */
  async getLabCenterById(labCenterId: string): Promise<LabCenter> {
    const doc = await collections.labCenters.doc(labCenterId).get();

    if (!doc.exists) {
      throw new NotFoundError('Lab center not found');
    }

    return doc.data() as LabCenter;
  }

  /**
   * Get all lab centers
   */
  async getLabCenters(
    page?: number,
    limit?: number
  ): Promise<{ labCenters: LabCenter[]; total: number }> {
    const { limit: l, offset } = parsePagination(page, limit);

    const countSnapshot = await collections.labCenters
      .where('isActive', '==', true)
      .count()
      .get();
    const total = countSnapshot.data().count;

    const snapshot = await collections.labCenters
      .where('isActive', '==', true)
      .offset(offset)
      .limit(l)
      .get();

    const labCenters = snapshot.docs.map(doc => doc.data() as LabCenter);

    return { labCenters, total };
  }

  /**
   * Create a new lab technician profile
   */
  async createLabTechnician(data: CreateLabTechnicianData): Promise<LabTechnician> {
    // Check if technician with same license number exists
    const existing = await collections.labTechnicians
      .where('licenseNumber', '==', data.licenseNumber)
      .limit(1)
      .get();

    if (!existing.empty) {
      throw new ConflictError('Lab technician with this license number already exists');
    }

    // Verify lab center exists
    await this.getLabCenterById(data.labCenterId);

    const technicianId = generateId();
    const now = new Date();

    const technician: LabTechnician = {
      id: technicianId,
      userId: data.userId,
      labCenterId: data.labCenterId,
      firstName: data.firstName,
      lastName: data.lastName,
      specialization: data.specialization,
      licenseNumber: data.licenseNumber,
      createdAt: now,
      updatedAt: now
    };

    await collections.labTechnicians.doc(technicianId).set(technician);

    return technician;
  }

  /**
   * Get lab technician by ID
   */
  async getLabTechnicianById(technicianId: string): Promise<LabTechnician> {
    const doc = await collections.labTechnicians.doc(technicianId).get();

    if (!doc.exists) {
      throw new NotFoundError('Lab technician not found');
    }

    return doc.data() as LabTechnician;
  }

  /**
   * Get lab technician by user ID
   */
  async getLabTechnicianByUserId(userId: string): Promise<LabTechnician> {
    const snapshot = await collections.labTechnicians
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new NotFoundError('Lab technician profile not found');
    }

    return snapshot.docs[0].data() as LabTechnician;
  }

  /**
   * Get lab technicians by lab center
   */
  async getLabTechniciansByCenter(labCenterId: string): Promise<LabTechnician[]> {
    const snapshot = await collections.labTechnicians
      .where('labCenterId', '==', labCenterId)
      .get();

    return snapshot.docs.map(doc => doc.data() as LabTechnician);
  }

  /**
   * Create a lab test order
   */
  async createLabTest(data: CreateLabTestData): Promise<LabTest> {
    // Verify patient exists
    const patientDoc = await collections.patients.doc(data.patientId).get();
    if (!patientDoc.exists) {
      throw new NotFoundError('Patient not found');
    }

    // Verify doctor exists
    const doctorDoc = await collections.doctors.doc(data.orderedBy).get();
    if (!doctorDoc.exists) {
      throw new NotFoundError('Doctor not found');
    }

    // If lab center specified, verify it exists
    if (data.labCenterId) {
      await this.getLabCenterById(data.labCenterId);
    }

    const testId = generateId();
    const now = new Date();

    const labTest: LabTest = {
      id: testId,
      visitId: data.visitId,
      patientId: data.patientId,
      orderedBy: data.orderedBy,
      labCenterId: data.labCenterId,
      testType: data.testType,
      testName: data.testName,
      status: LabTestStatus.ORDERED,
      notes: data.notes,
      createdAt: now,
      updatedAt: now
    };

    await collections.labTests.doc(testId).set(labTest);

    return labTest;
  }

  /**
   * Get lab test by ID
   */
  async getLabTestById(testId: string): Promise<LabTest> {
    const doc = await collections.labTests.doc(testId).get();

    if (!doc.exists) {
      throw new NotFoundError('Lab test not found');
    }

    return doc.data() as LabTest;
  }

  /**
   * Get patient's lab tests
   */
  async getPatientLabTests(
    patientId: string,
    page?: number,
    limit?: number
  ): Promise<{ tests: LabTest[]; total: number }> {
    const { limit: l, offset } = parsePagination(page, limit);

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

    const tests = snapshot.docs.map(doc => doc.data() as LabTest);

    return { tests, total };
  }

  /**
   * Get patient lab tests by Health ID
   */
  async getPatientLabTestsByHealthId(
    healthId: string
  ): Promise<{ tests: LabTest[]; patient: Patient }> {
    // Find patient by health ID
    const patientSnapshot = await collections.patients
      .where('healthId', '==', healthId)
      .limit(1)
      .get();

    if (patientSnapshot.empty) {
      throw new NotFoundError('Patient not found');
    }

    const patient = patientSnapshot.docs[0].data() as Patient;

    // Get lab tests for this patient
    const testsSnapshot = await collections.labTests
      .where('patientId', '==', patient.id)
      .orderBy('createdAt', 'desc')
      .get();

    const tests = testsSnapshot.docs.map(doc => doc.data() as LabTest);

    return { tests, patient };
  }

  /**
   * Get pending lab tests for a lab center
   */
  async getPendingLabTests(
    labCenterId: string,
    page?: number,
    limit?: number
  ): Promise<{ tests: LabTest[]; total: number }> {
    const { limit: l, offset } = parsePagination(page, limit);

    // Verify lab center exists
    await this.getLabCenterById(labCenterId);

    const pendingStatuses = [LabTestStatus.ORDERED, LabTestStatus.SAMPLE_COLLECTED, LabTestStatus.PROCESSING];

    const countSnapshot = await collections.labTests
      .where('labCenterId', '==', labCenterId)
      .where('status', 'in', pendingStatuses)
      .count()
      .get();
    const total = countSnapshot.data().count;

    const snapshot = await collections.labTests
      .where('labCenterId', '==', labCenterId)
      .where('status', 'in', pendingStatuses)
      .orderBy('createdAt', 'asc')
      .offset(offset)
      .limit(l)
      .get();

    const tests = snapshot.docs.map(doc => doc.data() as LabTest);

    return { tests, total };
  }

  /**
   * Update lab test status
   */
  async updateLabTestStatus(testId: string, status: LabTestStatus): Promise<LabTest> {
    const test = await this.getLabTestById(testId);

    const now = new Date();
    const updates: Partial<LabTest> = {
      status,
      updatedAt: now
    };

    if (status === LabTestStatus.SAMPLE_COLLECTED) {
      updates.sampleCollectedAt = now;
    }

    const updatedTest: LabTest = {
      ...test,
      ...updates
    };

    await collections.labTests.doc(testId).set(updatedTest, { merge: true });

    return updatedTest;
  }

  /**
   * Collect sample for a lab test
   */
  async collectSample(testId: string): Promise<LabTest> {
    const test = await this.getLabTestById(testId);

    if (test.status !== LabTestStatus.ORDERED) {
      throw new BadRequestError('Sample can only be collected for ordered tests');
    }

    return this.updateLabTestStatus(testId, LabTestStatus.SAMPLE_COLLECTED);
  }

  /**
   * Start processing a lab test
   */
  async startProcessing(testId: string): Promise<LabTest> {
    const test = await this.getLabTestById(testId);

    if (test.status !== LabTestStatus.SAMPLE_COLLECTED) {
      throw new BadRequestError('Processing can only start after sample collection');
    }

    return this.updateLabTestStatus(testId, LabTestStatus.PROCESSING);
  }

  /**
   * Complete lab test with results
   */
  async completeLabTest(testId: string, resultData: LabResultData): Promise<LabTest> {
    const test = await this.getLabTestById(testId);

    if (test.status !== LabTestStatus.PROCESSING) {
      throw new BadRequestError('Test must be in processing status to complete');
    }

    // Verify technician exists
    await this.getLabTechnicianById(resultData.verifiedBy);

    const now = new Date();
    const results: LabResult = {
      values: resultData.values,
      interpretation: resultData.interpretation,
      attachments: resultData.attachments,
      completedAt: now,
      verifiedBy: resultData.verifiedBy
    };

    const updatedTest: LabTest = {
      ...test,
      status: LabTestStatus.COMPLETED,
      results,
      updatedAt: now
    };

    await collections.labTests.doc(testId).set(updatedTest, { merge: true });

    return updatedTest;
  }

  /**
   * Cancel a lab test
   */
  async cancelLabTest(testId: string, reason?: string): Promise<LabTest> {
    const test = await this.getLabTestById(testId);

    if (test.status === LabTestStatus.COMPLETED) {
      throw new BadRequestError('Cannot cancel a completed test');
    }

    const now = new Date();
    const updatedTest: LabTest = {
      ...test,
      status: LabTestStatus.CANCELLED,
      notes: reason ? `${test.notes || ''}\nCancellation reason: ${reason}` : test.notes,
      updatedAt: now
    };

    await collections.labTests.doc(testId).set(updatedTest, { merge: true });

    return updatedTest;
  }

  /**
   * Assign lab test to a lab center
   */
  async assignToLabCenter(testId: string, labCenterId: string): Promise<LabTest> {
    const test = await this.getLabTestById(testId);

    // Verify lab center exists
    await this.getLabCenterById(labCenterId);

    const updatedTest: LabTest = {
      ...test,
      labCenterId,
      updatedAt: new Date()
    };

    await collections.labTests.doc(testId).set(updatedTest, { merge: true });

    return updatedTest;
  }

  /**
   * Get lab center statistics
   */
  async getLabCenterStats(labCenterId: string): Promise<{
    pendingTests: number;
    processingTests: number;
    completedToday: number;
    completedThisWeek: number;
  }> {
    await this.getLabCenterById(labCenterId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const [pendingSnapshot, processingSnapshot, todaySnapshot, weekSnapshot] = await Promise.all([
      collections.labTests
        .where('labCenterId', '==', labCenterId)
        .where('status', 'in', [LabTestStatus.ORDERED, LabTestStatus.SAMPLE_COLLECTED])
        .count()
        .get(),
      collections.labTests
        .where('labCenterId', '==', labCenterId)
        .where('status', '==', LabTestStatus.PROCESSING)
        .count()
        .get(),
      collections.labTests
        .where('labCenterId', '==', labCenterId)
        .where('status', '==', LabTestStatus.COMPLETED)
        .where('updatedAt', '>=', today)
        .count()
        .get(),
      collections.labTests
        .where('labCenterId', '==', labCenterId)
        .where('status', '==', LabTestStatus.COMPLETED)
        .where('updatedAt', '>=', weekAgo)
        .count()
        .get()
    ]);

    return {
      pendingTests: pendingSnapshot.data().count,
      processingTests: processingSnapshot.data().count,
      completedToday: todaySnapshot.data().count,
      completedThisWeek: weekSnapshot.data().count
    };
  }
}

export const labService = new LabService();
