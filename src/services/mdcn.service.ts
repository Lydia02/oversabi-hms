import { collections } from '../config/firebase.js';
import { MDCNRecord } from '../types/index.js';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors.js';

// 15 Sample MDCN records for doctor registration
// Each MDCN can only be used once - when a doctor registers, it gets marked as "used"
const SAMPLE_MDCN_RECORDS: Omit<MDCNRecord, 'id'>[] = [
  {
    mdcnNumber: 'MDCN/2020/12345',
    doctorName: 'Available for Registration',
    hospitalName: 'Lagos University Teaching Hospital (LUTH)',
    hospitalAddress: 'Idi-Araba, Surulere, Lagos',
    specialization: 'General Surgery',
    isActive: true,
    registeredAt: new Date('2020-01-15'),
    expiresAt: new Date('2030-01-15')
  },
  {
    mdcnNumber: 'MDCN/2019/67890',
    doctorName: 'Available for Registration',
    hospitalName: 'National Hospital Abuja',
    hospitalAddress: 'Central Business District, Abuja',
    specialization: 'Cardiology',
    isActive: true,
    registeredAt: new Date('2019-06-20'),
    expiresAt: new Date('2030-06-20')
  },
  {
    mdcnNumber: 'MDCN/2021/11111',
    doctorName: 'Available for Registration',
    hospitalName: 'University of Nigeria Teaching Hospital (UNTH)',
    hospitalAddress: 'Ituku-Ozalla, Enugu',
    specialization: 'Pediatrics',
    isActive: true,
    registeredAt: new Date('2021-03-10'),
    expiresAt: new Date('2030-03-10')
  },
  {
    mdcnNumber: 'MDCN/2018/22222',
    doctorName: 'Available for Registration',
    hospitalName: 'Ahmadu Bello University Teaching Hospital (ABUTH)',
    hospitalAddress: 'Shika, Zaria, Kaduna',
    specialization: 'Obstetrics & Gynecology',
    isActive: true,
    registeredAt: new Date('2018-09-05'),
    expiresAt: new Date('2030-09-05')
  },
  {
    mdcnNumber: 'MDCN/2022/33333',
    doctorName: 'Available for Registration',
    hospitalName: 'University College Hospital (UCH) Ibadan',
    hospitalAddress: 'Queen Elizabeth Road, Ibadan',
    specialization: 'Internal Medicine',
    isActive: true,
    registeredAt: new Date('2022-02-28'),
    expiresAt: new Date('2030-02-28')
  },
  {
    mdcnNumber: 'MDCN/2020/44444',
    doctorName: 'Available for Registration',
    hospitalName: 'Lagos State University Teaching Hospital (LASUTH)',
    hospitalAddress: 'Ikeja, Lagos',
    specialization: 'Orthopedics',
    isActive: true,
    registeredAt: new Date('2020-05-15'),
    expiresAt: new Date('2030-05-15')
  },
  {
    mdcnNumber: 'MDCN/2021/55555',
    doctorName: 'Available for Registration',
    hospitalName: 'Obafemi Awolowo University Teaching Hospital (OAUTH)',
    hospitalAddress: 'Ile-Ife, Osun State',
    specialization: 'Neurology',
    isActive: true,
    registeredAt: new Date('2021-07-20'),
    expiresAt: new Date('2030-07-20')
  },
  {
    mdcnNumber: 'MDCN/2019/66666',
    doctorName: 'Available for Registration',
    hospitalName: 'University of Benin Teaching Hospital (UBTH)',
    hospitalAddress: 'Benin City, Edo State',
    specialization: 'Dermatology',
    isActive: true,
    registeredAt: new Date('2019-11-10'),
    expiresAt: new Date('2030-11-10')
  },
  {
    mdcnNumber: 'MDCN/2022/77777',
    doctorName: 'Available for Registration',
    hospitalName: 'Jos University Teaching Hospital (JUTH)',
    hospitalAddress: 'Jos, Plateau State',
    specialization: 'Psychiatry',
    isActive: true,
    registeredAt: new Date('2022-03-25'),
    expiresAt: new Date('2030-03-25')
  },
  {
    mdcnNumber: 'MDCN/2020/88888',
    doctorName: 'Available for Registration',
    hospitalName: 'University of Ilorin Teaching Hospital (UITH)',
    hospitalAddress: 'Ilorin, Kwara State',
    specialization: 'Ophthalmology',
    isActive: true,
    registeredAt: new Date('2020-08-12'),
    expiresAt: new Date('2030-08-12')
  },
  {
    mdcnNumber: 'MDCN/2021/99999',
    doctorName: 'Available for Registration',
    hospitalName: 'Federal Medical Centre Abeokuta',
    hospitalAddress: 'Abeokuta, Ogun State',
    specialization: 'ENT (Ear, Nose, Throat)',
    isActive: true,
    registeredAt: new Date('2021-01-30'),
    expiresAt: new Date('2030-01-30')
  },
  {
    mdcnNumber: 'MDCN/2019/10101',
    doctorName: 'Available for Registration',
    hospitalName: 'Aminu Kano Teaching Hospital',
    hospitalAddress: 'Kano, Kano State',
    specialization: 'Radiology',
    isActive: true,
    registeredAt: new Date('2019-04-18'),
    expiresAt: new Date('2030-04-18')
  },
  {
    mdcnNumber: 'MDCN/2022/20202',
    doctorName: 'Available for Registration',
    hospitalName: 'University of Calabar Teaching Hospital (UCTH)',
    hospitalAddress: 'Calabar, Cross River State',
    specialization: 'Oncology',
    isActive: true,
    registeredAt: new Date('2022-06-08'),
    expiresAt: new Date('2030-06-08')
  },
  {
    mdcnNumber: 'MDCN/2020/30303',
    doctorName: 'Available for Registration',
    hospitalName: 'Federal Teaching Hospital Owerri',
    hospitalAddress: 'Owerri, Imo State',
    specialization: 'Urology',
    isActive: true,
    registeredAt: new Date('2020-10-22'),
    expiresAt: new Date('2030-10-22')
  },
  {
    mdcnNumber: 'MDCN/2021/40404',
    doctorName: 'Available for Registration',
    hospitalName: 'University of Port Harcourt Teaching Hospital (UPTH)',
    hospitalAddress: 'Port Harcourt, Rivers State',
    specialization: 'Anesthesiology',
    isActive: true,
    registeredAt: new Date('2021-09-14'),
    expiresAt: new Date('2030-09-14')
  }
];

class MDCNService {
  /**
   * Seed the database with sample MDCN records
   */
  async seedMDCNRecords(): Promise<{ message: string; count: number }> {
    let count = 0;

    for (const record of SAMPLE_MDCN_RECORDS) {
      // Check if already exists
      const existing = await collections.mdcnRecords
        .where('mdcnNumber', '==', record.mdcnNumber)
        .limit(1)
        .get();

      if (existing.empty) {
        const docRef = collections.mdcnRecords.doc();
        await docRef.set({
          id: docRef.id,
          ...record,
          isUsed: false,  // Track if MDCN has been used for registration
          usedBy: null    // Will store the user ID who used this MDCN
        });
        count++;
      }
    }

    return {
      message: count > 0 ? `Seeded ${count} MDCN records` : 'MDCN records already exist',
      count
    };
  }

  /**
   * Verify MDCN number exists, is active, and has not been used
   */
  async verifyMDCN(mdcnNumber: string): Promise<MDCNRecord & { isUsed?: boolean }> {
    const snapshot = await collections.mdcnRecords
      .where('mdcnNumber', '==', mdcnNumber.toUpperCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new NotFoundError('MDCN number not found. Please verify your MDCN number is correct.');
    }

    const mdcnRecord = snapshot.docs[0].data() as MDCNRecord & { isUsed?: boolean; usedBy?: string };

    if (!mdcnRecord.isActive) {
      throw new BadRequestError('This MDCN registration is no longer active.');
    }

    // Check if expired
    if (new Date() > new Date(mdcnRecord.expiresAt)) {
      throw new BadRequestError('This MDCN registration has expired. Please renew your registration.');
    }

    // Check if already used by another doctor
    if (mdcnRecord.isUsed) {
      throw new ConflictError('This MDCN number has already been used for registration. Each MDCN can only be used once.');
    }

    return mdcnRecord;
  }

  /**
   * Mark MDCN as used after successful doctor registration
   */
  async markMDCNAsUsed(mdcnNumber: string, userId: string, doctorName: string): Promise<void> {
    const snapshot = await collections.mdcnRecords
      .where('mdcnNumber', '==', mdcnNumber.toUpperCase())
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      await docRef.update({
        isUsed: true,
        usedBy: userId,
        doctorName: doctorName,
        usedAt: new Date()
      });
    }
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
  async getAllMDCNRecords(): Promise<(MDCNRecord & { isUsed?: boolean })[]> {
    const snapshot = await collections.mdcnRecords.get();
    return snapshot.docs.map(doc => doc.data() as MDCNRecord & { isUsed?: boolean });
  }

  /**
   * Get available (unused) MDCN numbers for testing
   */
  async getAvailableMDCNNumbers(): Promise<{ mdcnNumber: string; hospitalName: string; specialization: string }[]> {
    const snapshot = await collections.mdcnRecords
      .where('isUsed', '==', false)
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data() as MDCNRecord;
      return {
        mdcnNumber: data.mdcnNumber,
        hospitalName: data.hospitalName,
        specialization: data.specialization
      };
    });
  }

  /**
   * Get sample MDCN numbers (static list for reference)
   */
  getSampleMDCNNumbers(): { mdcnNumber: string; hospitalName: string; specialization: string }[] {
    return SAMPLE_MDCN_RECORDS.map(r => ({
      mdcnNumber: r.mdcnNumber,
      hospitalName: r.hospitalName,
      specialization: r.specialization
    }));
  }
}

export const mdcnService = new MDCNService();
