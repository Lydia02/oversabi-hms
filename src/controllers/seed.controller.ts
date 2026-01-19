import { Request, Response, NextFunction } from 'express';
import { seedService } from '../services/seed.service.js';

/**
 * @swagger
 * /seed/patients:
 *   post:
 *     summary: Seed database with 10 Nigerian patient users
 *     description: |
 *       **Development/Testing only.**
 *
 *       Seeds the database with 10 sample Nigerian patients with common health conditions.
 *
 *       **Default password for all patients:** `Password123!`
 *
 *       **Sample Patients:**
 *       | Unique ID | Name | Condition |
 *       |-----------|------|-----------|
 *       | PAT_101 | Chidinma Okonkwo | Malaria and Typhoid |
 *       | PAT_102 | Oluwaseun Adeyemi | Hypertension |
 *       | PAT_103 | Amina Bello | Diabetes Type 2 |
 *       | PAT_104 | Chukwuemeka Eze | Arthritis |
 *       | PAT_105 | Folake Ogundimu | Asthma |
 *       | PAT_106 | Ibrahim Musa | Chronic Back Pain |
 *       | PAT_107 | Ngozi Nnamdi | Peptic Ulcer |
 *       | PAT_108 | Tunde Bakare | High Cholesterol |
 *       | PAT_109 | Hauwa Suleiman | Migraine |
 *       | PAT_110 | Obiora Okeke | Pneumonia |
 *     tags: [Seed Data]
 *     responses:
 *       200:
 *         description: Patients seeded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Seeded 10 patients. Default password: Password123!"
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 10
 *                     patients:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           uniqueId:
 *                             type: string
 *                             example: "PAT_101"
 *                           name:
 *                             type: string
 *                             example: "Chidinma Okonkwo"
 *                           email:
 *                             type: string
 *                             example: "chidinma.okonkwo@gmail.com"
 */
export async function seedPatients(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await seedService.seedPatients();

    res.json({
      success: true,
      message: result.message,
      data: {
        count: result.count,
        patients: result.patients
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /seed/doctors:
 *   post:
 *     summary: Seed database with sample doctors
 *     description: |
 *       **Development/Testing only.**
 *
 *       Seeds the database with 2 sample Nigerian doctors.
 *
 *       **Default password for all doctors:** `DoctorPass123!`
 *
 *       **Sample Doctors:**
 *       | Unique ID | Name | Hospital |
 *       |-----------|------|----------|
 *       | DOC_201 | Dr. Adebayo Ogunlesi | Lagos University Teaching Hospital (LUTH) |
 *       | DOC_202 | Dr. Ngozi Okonkwo | National Hospital Abuja |
 *     tags: [Seed Data]
 *     responses:
 *       200:
 *         description: Doctors seeded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Seeded 2 doctors. Default password: DoctorPass123!"
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 2
 *                     doctors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           uniqueId:
 *                             type: string
 *                             example: "DOC_201"
 *                           name:
 *                             type: string
 *                             example: "Dr. Adebayo Ogunlesi"
 *                           email:
 *                             type: string
 *                             example: "dr.adebayo@luth.gov.ng"
 */
export async function seedDoctors(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await seedService.seedDoctors();

    res.json({
      success: true,
      message: result.message,
      data: {
        count: result.count,
        doctors: result.doctors
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /seed/reports:
 *   post:
 *     summary: Seed database with sample medical reports
 *     description: |
 *       **Development/Testing only.**
 *
 *       Seeds the database with sample medical reports for testing.
 *       **Requires patients and doctors to be seeded first.**
 *
 *       Creates sample reports linking patients to doctors with realistic Nigerian health conditions.
 *     tags: [Seed Data]
 *     responses:
 *       200:
 *         description: Medical reports seeded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Seeded 3 medical reports"
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 3
 */
export async function seedMedicalReports(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await seedService.seedMedicalReports();

    res.json({
      success: true,
      message: result.message,
      data: {
        count: result.count
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /seed/all:
 *   post:
 *     summary: Seed all sample data (patients, doctors, and reports)
 *     description: |
 *       **Development/Testing only.**
 *
 *       Seeds all sample data in one call:
 *       - 10 Nigerian patients
 *       - 2 Nigerian doctors
 *       - Sample medical reports
 *
 *       **Credentials:**
 *       - Patient password: `Password123!`
 *       - Doctor password: `DoctorPass123!`
 *
 *       **Recommended:** Use this endpoint first when setting up a new environment.
 *     tags: [Seed Data]
 *     responses:
 *       200:
 *         description: All data seeded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "All sample data seeded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     patients:
 *                       type: object
 *                       properties:
 *                         message:
 *                           type: string
 *                         count:
 *                           type: integer
 *                     doctors:
 *                       type: object
 *                       properties:
 *                         message:
 *                           type: string
 *                         count:
 *                           type: integer
 *                     reports:
 *                       type: object
 *                       properties:
 *                         message:
 *                           type: string
 *                         count:
 *                           type: integer
 *                     credentials:
 *                       type: object
 *                       properties:
 *                         patientPassword:
 *                           type: string
 *                           example: "Password123!"
 *                         doctorPassword:
 *                           type: string
 *                           example: "DoctorPass123!"
 */
export async function seedAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await seedService.seedAll();

    res.json({
      success: true,
      message: 'All sample data seeded successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /seed/credentials:
 *   get:
 *     summary: Get all sample user credentials for testing
 *     description: |
 *       **Development/Testing only.**
 *
 *       Returns a list of all sample user credentials (patients and doctors) for testing purposes.
 *       Use these credentials to login and test the API.
 *     tags: [Seed Data]
 *     responses:
 *       200:
 *         description: Sample credentials retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     patients:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           uniqueId:
 *                             type: string
 *                             example: "PAT_101"
 *                           name:
 *                             type: string
 *                             example: "Chidinma Okonkwo"
 *                           email:
 *                             type: string
 *                             example: "chidinma.okonkwo@gmail.com"
 *                           password:
 *                             type: string
 *                             example: "Password123!"
 *                           condition:
 *                             type: string
 *                             example: "Malaria and Typhoid"
 *                     doctors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           uniqueId:
 *                             type: string
 *                             example: "DOC_201"
 *                           name:
 *                             type: string
 *                             example: "Dr. Adebayo Ogunlesi"
 *                           email:
 *                             type: string
 *                             example: "dr.adebayo@luth.gov.ng"
 *                           password:
 *                             type: string
 *                             example: "DoctorPass123!"
 *                           hospital:
 *                             type: string
 *                             example: "Lagos University Teaching Hospital (LUTH)"
 */
export async function getCredentials(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const patients = seedService.getSamplePatientCredentials();
    const doctors = seedService.getSampleDoctorCredentials();

    res.json({
      success: true,
      data: {
        patients,
        doctors
      }
    });
  } catch (error) {
    next(error);
  }
}
