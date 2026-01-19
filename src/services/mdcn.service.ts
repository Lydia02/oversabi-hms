import { collections } from '../config/firebase.js';
import { MDCNRecord } from '../types/index.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

// Sample MDCN records for verification
const SAMPLE_MDCN_RECORDS: Omit<MDCNRecord, 'id'>[] = [
  {
    mdcnNumber: 'MDCN/2020/12345',
    doctorName: 'Dr. Adebayo Ogunlesi',
    hospitalName: 'Lagos University Teaching Hospital (LUTH)',
    hospitalAddress: 'Idi-Araba, Surulere, Lagos',
    specialization: 'General Surgery',
    isActive: true,
    registeredAt: new Date('2020-01-15'),
    expiresAt: new Date('2025-01-15')
  },
  {
    mdcnNumber: 'MDCN/2019/67890',
    doctorName: 'Dr. Ngozi Okonkwo',
    hospitalName: 'National Hospital Abuja',
    hospitalAddress: 'Central Business District, Abuja',
    specialization: 'Cardiology',
    isActive: true,
    registeredAt: new Date('2019-06-20'),
    expiresAt: new Date('2024-06-20')
  },
  {
    mdcnNumber: 'MDCN/2021/11111',
    doctorName: 'Dr. Emeka Nwosu',
    hospitalName: 'University of Nigeria Teaching Hospital (UNTH)',
    hospitalAddress: 'Ituku-Ozalla, Enugu',
    specialization: 'Pediatrics',
    isActive: true,
    registeredAt: new Date('2021-03-10'),
    expiresAt: new Date('2026-03-10')
  },
  {
    mdcnNumber: 'MDCN/2018/22222',
    doctorName: 'Dr. Fatima Bello',
    hospitalName: 'Ahmadu Bello University Teaching Hospital',
    hospitalAddress: 'Shika, Zaria, Kaduna',
    specialization: 'Obstetrics & Gynecology',
    isActive: true,
    registeredAt: new Date('2018-09-05'),
    expiresAt: new Date('2023-09-05')
  },
  {
    mdcnNumber: 'MDCN/2022/33333',
    doctorName: 'Dr. Oluwaseun Adeleke',
    hospitalName: 'University College Hospital (UCH) Ibadan',
    hospitalAddress: 'Queen Elizabeth Road, Ibadan',
    specialization: 'Internal Medicine',
    isActive: true,
    registeredAt: new Date('2022-02-28'),
    expiresAt: new Date('2027-02-28')
  }
];

class MDCNService {
  /**
   * Seed the database with sample MDCN records
   */
  async seedMDCNRecords(): Promise<{ message: string; count: number }> {
    const batch = collections.mdcnRecords.firestore.batch();
    let count = 0;

    for (const record of SAMPLE_MDCN_RECORDS) {
      // Check if already exists
      const existing = await collections.mdcnRecords
        .where('mdcnNumber', '==', record.mdcnNumber)
        .limit(1)
        .get();

      if (existing.empty) {
        const docRef = collections.mdcnRecords.doc();
        batch.set(docRef, {
          id: docRef.id,
          ...record
        });
        count++;
      }
    }

    if (count > 0) {
      await batch.commit();
    }

    return {
      message: count > 0 ? `Seeded ${count} MDCN records` : 'MDCN records already exist',
      count
    };
  }

  /**
   * Verify MDCN number exists and is active
   */
  async verifyMDCN(mdcnNumber: string): Promise<MDCNRecord> {
    const snapshot = await collections.mdcnRecords
      .where('mdcnNumber', '==', mdcnNumber.toUpperCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new NotFoundError('MDCN number not found. Please verify your MDCN number is correct.');
    }

    const mdcnRecord = snapshot.docs[0].data() as MDCNRecord;

    if (!mdcnRecord.isActive) {
      throw new BadRequestError('This MDCN registration is no longer active.');
    }

    // Check if expired
    if (new Date() > new Date(mdcnRecord.expiresAt)) {
      throw new BadRequestError('This MDCN registration has expired. Please renew your registration.');
    }

    return mdcnRecord;
  }

  /**
   * Get MDCN record by number
   */
  async getMDCNByNumber(mdcnNumber: string): Promise<MDCNRecord | null> {
    const snapshot = await collections.mdcnRecords
      .where('mdcnNumber', '==', mdcnNumber.toUpperCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data() as MDCNRecord;
  }

  /**
   * Get all MDCN records (for admin purposes)
   */
  async getAllMDCNRecords(): Promise<MDCNRecord[]> {
    const snapshot = await collections.mdcnRecords.get();
    return snapshot.docs.map(doc => doc.data() as MDCNRecord);
  }

  /**
   * Get sample MDCN numbers (for testing/demo purposes)
   */
  getSampleMDCNNumbers(): string[] {
    return SAMPLE_MDCN_RECORDS.map(r => r.mdcnNumber);
  }
}

export const mdcnService = new MDCNService();
