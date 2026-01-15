import { Request, Response, NextFunction } from 'express';
import { patientService, CreatePatientData, UpdatePatientData } from '../services/patient.service.js';
import { consentService } from '../services/consent.service.js';
import { Gender, BloodType, UserRole } from '../types/index.js';
import { getString, getOptionalString } from '../utils/helpers.js';

/**
 * @swagger
 * /patients:
 *   post:
 *     summary: Create a new patient with Health ID
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - dateOfBirth
 *               - gender
 *               - phoneNumber
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               phoneNumber:
 *                 type: string
 *               email:
 *                 type: string
 *               nin:
 *                 type: string
 *                 description: National Identification Number (optional)
 *               bloodType:
 *                 type: string
 *                 enum: [A+, A-, B+, B-, O+, O-, AB+, AB-]
 *               allergies:
 *                 type: array
 *                 items:
 *                   type: string
 *               chronicConditions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Patient created with Health ID
 *       409:
 *         description: Patient already exists
 */
export async function createPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const data: CreatePatientData = {
      userId,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      dateOfBirth: new Date(req.body.dateOfBirth),
      gender: req.body.gender as Gender,
      phoneNumber: req.body.phoneNumber,
      email: req.body.email,
      nin: req.body.nin,
      address: req.body.address,
      bloodType: req.body.bloodType as BloodType,
      allergies: req.body.allergies,
      chronicConditions: req.body.chronicConditions,
      emergencyContact: req.body.emergencyContact
    };

    const patient = await patientService.createPatient(data);

    res.status(201).json({
      success: true,
      message: 'Patient created successfully. Health ID generated.',
      data: {
        patient,
        healthId: patient.healthId,
        qrCode: patient.qrCode
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /patients/me:
 *   get:
 *     summary: Get current patient's profile
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Patient profile retrieved
 *       404:
 *         description: Patient profile not found
 */
export async function getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    const patient = await patientService.getPatientByUserId(userId);

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /patients/{id}:
 *   get:
 *     summary: Get patient by ID
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Patient retrieved
 *       404:
 *         description: Patient not found
 */
export async function getPatientById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getString(req.params.id);

    const patient = await patientService.getPatientById(id);

    // Log access
    await consentService.logAccess(
      patient.id,
      req.user!.userId,
      req.user!.role,
      'VIEW_PATIENT',
      ['basic_info'],
      false
    );

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /patients/health-id/{healthId}:
 *   get:
 *     summary: Get patient by Health ID
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: healthId
 *         required: true
 *         schema:
 *           type: string
 *         example: OSB-ABC12345
 *     responses:
 *       200:
 *         description: Patient retrieved
 *       404:
 *         description: Patient not found
 */
export async function getPatientByHealthId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const healthId = getString(req.params.healthId);

    const patient = await patientService.getPatientByHealthId(healthId);

    // Check consent for providers
    if (req.user!.role !== UserRole.PATIENT) {
      const { hasConsent } = await consentService.checkConsent(patient.id, req.user!.userId);

      // Log access
      await consentService.logAccess(
        patient.id,
        req.user!.userId,
        req.user!.role,
        'VIEW_PATIENT_BY_HEALTH_ID',
        ['basic_info'],
        false
      );

      if (!hasConsent) {
        // Return limited info without consent
        res.json({
          success: true,
          message: 'Limited access - consent required for full record',
          data: {
            healthId: patient.healthId,
            firstName: patient.firstName,
            lastName: patient.lastName,
            consentRequired: true
          }
        });
        return;
      }
    }

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /patients/phone/{phoneNumber}:
 *   get:
 *     summary: Get patient by phone number
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: phoneNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Patient retrieved
 *       404:
 *         description: Patient not found
 */
export async function getPatientByPhone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const phoneNumber = getString(req.params.phoneNumber);

    const patient = await patientService.getPatientByPhone(phoneNumber);

    res.json({
      success: true,
      data: {
        healthId: patient.healthId,
        firstName: patient.firstName,
        lastName: patient.lastName,
        patientId: patient.id
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /patients/{id}:
 *   patch:
 *     summary: Update patient information
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               bloodType:
 *                 type: string
 *               allergies:
 *                 type: array
 *                 items:
 *                   type: string
 *               chronicConditions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Patient updated
 */
export async function updatePatient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getString(req.params.id);
    const data: UpdatePatientData = req.body;

    const patient = await patientService.updatePatient(id, data);

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: patient
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /patients:
 *   get:
 *     summary: Get all patients (paginated)
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Patients retrieved
 */
export async function getAllPatients(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = req.query;

    const result = await patientService.getAllPatients(
      parseInt(page as string) || 1,
      parseInt(limit as string) || 10
    );

    res.json({
      success: true,
      data: result.patients,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /patients/search:
 *   get:
 *     summary: Search patients
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query (name or Health ID)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Search results
 */
export async function searchPatients(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { q, page, limit } = req.query;

    const result = await patientService.searchPatients(
      q as string,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 10
    );

    res.json({
      success: true,
      data: result.patients,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /patients/{id}/visits:
 *   get:
 *     summary: Get patient's visit history
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Visit history retrieved
 */
export async function getPatientVisits(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getString(req.params.id);
    const { page, limit } = req.query;

    const result = await patientService.getPatientVisits(
      id,
      parseInt(getString(page)) || 1,
      parseInt(getString(limit)) || 10
    );

    res.json({
      success: true,
      data: result.visits,
      total: result.total
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /patients/{id}/prescriptions:
 *   get:
 *     summary: Get patient's prescriptions
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Prescriptions retrieved
 */
export async function getPatientPrescriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getString(req.params.id);
    const { page, limit } = req.query;

    const result = await patientService.getPatientPrescriptions(
      id,
      parseInt(getString(page)) || 1,
      parseInt(getString(limit)) || 10
    );

    res.json({
      success: true,
      data: result.prescriptions,
      total: result.total
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /patients/{id}/lab-tests:
 *   get:
 *     summary: Get patient's lab tests
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lab tests retrieved
 */
export async function getPatientLabTests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getString(req.params.id);
    const { page, limit } = req.query;

    const result = await patientService.getPatientLabTests(
      id,
      parseInt(getString(page)) || 1,
      parseInt(getString(limit)) || 10
    );

    res.json({
      success: true,
      data: result.labTests,
      total: result.total
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /patients/emergency/{healthId}:
 *   get:
 *     summary: Get emergency profile (for unconscious patients)
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: healthId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Emergency profile (limited data)
 */
export async function getEmergencyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const healthId = getString(req.params.healthId);

    const emergencyProfile = await patientService.getEmergencyProfile(healthId);

    // Get patient ID for logging
    const patient = await patientService.getPatientByHealthId(healthId);

    // Log emergency access
    await consentService.logAccess(
      patient.id,
      req.user!.userId,
      req.user!.role,
      'EMERGENCY_ACCESS',
      ['blood_type', 'allergies', 'chronic_conditions', 'emergency_contact'],
      true
    );

    res.json({
      success: true,
      message: 'Emergency access granted - logged for audit',
      data: emergencyProfile
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /patients/{id}/regenerate-qr:
 *   post:
 *     summary: Regenerate QR code for patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: QR code regenerated
 */
export async function regenerateQRCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getString(req.params.id);

    const qrCode = await patientService.regenerateQRCode(id);

    res.json({
      success: true,
      message: 'QR code regenerated successfully',
      data: { qrCode }
    });
  } catch (error) {
    next(error);
  }
}
