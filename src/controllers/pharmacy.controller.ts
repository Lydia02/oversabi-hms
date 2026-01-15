import { Request, Response, NextFunction } from 'express';
import { pharmacyService, CreatePharmacyData, CreatePharmacistData, CreatePharmacyVisitData } from '../services/pharmacy.service.js';
import { getString, getOptionalString } from '../utils/helpers.js';

/**
 * @swagger
 * /pharmacy:
 *   post:
 *     summary: Create a new pharmacy
 *     tags: [Pharmacy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - phoneNumber
 *               - licenseNumber
 *             properties:
 *               name:
 *                 type: string
 *               hospitalId:
 *                 type: string
 *                 description: Optional - if pharmacy is part of a hospital
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   country:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *               phoneNumber:
 *                 type: string
 *               licenseNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pharmacy created
 */
export async function createPharmacy(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data: CreatePharmacyData = req.body;

    const pharmacy = await pharmacyService.createPharmacy(data);

    res.status(201).json({
      success: true,
      message: 'Pharmacy created successfully',
      data: pharmacy
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /pharmacy:
 *   get:
 *     summary: Get all pharmacies
 *     tags: [Pharmacy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Pharmacies retrieved
 */
export async function getPharmacies(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(getString(req.query.page)) || 1;
    const limit = parseInt(getString(req.query.limit)) || 10;

    const result = await pharmacyService.getPharmacies(page, limit);

    res.json({
      success: true,
      data: result.pharmacies,
      total: result.total
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /pharmacy/{id}:
 *   get:
 *     summary: Get pharmacy by ID
 *     tags: [Pharmacy]
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
 *         description: Pharmacy retrieved
 */
export async function getPharmacyById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getString(req.params.id);

    const pharmacy = await pharmacyService.getPharmacyById(id);

    res.json({
      success: true,
      data: pharmacy
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /pharmacy/pharmacist:
 *   post:
 *     summary: Create a new pharmacist profile
 *     tags: [Pharmacy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pharmacyId
 *               - firstName
 *               - lastName
 *               - licenseNumber
 *               - phoneNumber
 *               - email
 *             properties:
 *               pharmacyId:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               licenseNumber:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pharmacist profile created
 */
export async function createPharmacist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const data: CreatePharmacistData = {
      userId,
      ...req.body
    };

    const pharmacist = await pharmacyService.createPharmacist(data);

    res.status(201).json({
      success: true,
      message: 'Pharmacist profile created successfully',
      data: pharmacist
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /pharmacy/pharmacist/me:
 *   get:
 *     summary: Get current pharmacist's profile
 *     tags: [Pharmacy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pharmacist profile retrieved
 */
export async function getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    const pharmacist = await pharmacyService.getPharmacistByUserId(userId);

    res.json({
      success: true,
      data: pharmacist
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /pharmacy/{pharmacyId}/pharmacists:
 *   get:
 *     summary: Get all pharmacists in a pharmacy
 *     tags: [Pharmacy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pharmacyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pharmacists retrieved
 */
export async function getPharmacistsByPharmacy(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pharmacyId = getString(req.params.pharmacyId);

    const pharmacists = await pharmacyService.getPharmacistsByPharmacy(pharmacyId);

    res.json({
      success: true,
      data: pharmacists,
      count: pharmacists.length
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /pharmacy/{pharmacyId}/prescriptions/pending:
 *   get:
 *     summary: Get pending prescriptions to dispense
 *     tags: [Pharmacy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pharmacyId
 *         required: true
 *         schema:
 *           type: string
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
 *         description: Pending prescriptions retrieved
 */
export async function getPendingPrescriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pharmacyId = getString(req.params.pharmacyId);
    const page = parseInt(getString(req.query.page)) || 1;
    const limit = parseInt(getString(req.query.limit)) || 10;

    const result = await pharmacyService.getPendingPrescriptions(pharmacyId, page, limit);

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
 * /pharmacy/prescriptions/{prescriptionId}:
 *   get:
 *     summary: Get prescription by ID
 *     tags: [Pharmacy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: prescriptionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Prescription retrieved
 */
export async function getPrescriptionById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const prescriptionId = getString(req.params.prescriptionId);

    const prescription = await pharmacyService.getPrescriptionById(prescriptionId);

    res.json({
      success: true,
      data: prescription
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /pharmacy/patient/{healthId}/prescriptions:
 *   get:
 *     summary: Get patient prescriptions by Health ID
 *     tags: [Pharmacy]
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
 *         description: Patient prescriptions retrieved
 */
export async function getPatientPrescriptionsByHealthId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const healthId = getString(req.params.healthId);

    const result = await pharmacyService.getPatientPrescriptionsByHealthId(healthId);

    res.json({
      success: true,
      data: {
        patient: {
          id: result.patient.id,
          healthId: result.patient.healthId,
          name: `${result.patient.firstName} ${result.patient.lastName}`,
          allergies: result.patient.allergies
        },
        prescriptions: result.prescriptions
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /pharmacy/prescriptions/{prescriptionId}/dispense:
 *   post:
 *     summary: Dispense a prescription
 *     tags: [Pharmacy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: prescriptionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pharmacistId
 *             properties:
 *               pharmacistId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Prescription dispensed
 */
export async function dispensePrescription(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const prescriptionId = getString(req.params.prescriptionId);
    const { pharmacistId } = req.body;

    const prescription = await pharmacyService.dispensePrescription(prescriptionId, pharmacistId);

    res.json({
      success: true,
      message: 'Prescription dispensed successfully',
      data: prescription
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /pharmacy/visits:
 *   post:
 *     summary: Create a pharmacy visit (pharmacy-first flow)
 *     tags: [Pharmacy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - pharmacyId
 *               - pharmacistId
 *               - symptoms
 *             properties:
 *               patientId:
 *                 type: string
 *               pharmacyId:
 *                 type: string
 *               pharmacistId:
 *                 type: string
 *               symptoms:
 *                 type: array
 *                 items:
 *                   type: string
 *               dispensedMedications:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     dosage:
 *                       type: string
 *                     frequency:
 *                       type: string
 *                     duration:
 *                       type: string
 *                     instructions:
 *                       type: string
 *               redFlagsDetected:
 *                 type: array
 *                 items:
 *                   type: string
 *               referralRequired:
 *                 type: boolean
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pharmacy visit created
 */
export async function createPharmacyVisit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data: CreatePharmacyVisitData = req.body;

    const visit = await pharmacyService.createPharmacyVisit(data);

    res.status(201).json({
      success: true,
      message: 'Pharmacy visit created successfully',
      data: visit
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /pharmacy/visits/{visitId}:
 *   get:
 *     summary: Get pharmacy visit by ID
 *     tags: [Pharmacy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: visitId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pharmacy visit retrieved
 */
export async function getPharmacyVisitById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const visitId = getString(req.params.visitId);

    const visit = await pharmacyService.getPharmacyVisitById(visitId);

    res.json({
      success: true,
      data: visit
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /pharmacy/visits/{visitId}:
 *   patch:
 *     summary: Update pharmacy visit (add red flags, referral, etc.)
 *     tags: [Pharmacy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: visitId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               redFlagsDetected:
 *                 type: array
 *                 items:
 *                   type: string
 *               referralRequired:
 *                 type: boolean
 *               referralId:
 *                 type: string
 *               dispensedMedications:
 *                 type: array
 *                 items:
 *                   type: object
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pharmacy visit updated
 */
export async function updatePharmacyVisit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const visitId = getString(req.params.visitId);
    const data = req.body;

    const visit = await pharmacyService.updatePharmacyVisit(visitId, data);

    res.json({
      success: true,
      message: 'Pharmacy visit updated successfully',
      data: visit
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /pharmacy/patient/{patientId}/visits:
 *   get:
 *     summary: Get patient's pharmacy visits
 *     tags: [Pharmacy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
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
 *         description: Patient pharmacy visits retrieved
 */
export async function getPatientPharmacyVisits(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const patientId = getString(req.params.patientId);
    const page = parseInt(getString(req.query.page)) || 1;
    const limit = parseInt(getString(req.query.limit)) || 10;

    const result = await pharmacyService.getPatientPharmacyVisits(patientId, page, limit);

    res.json({
      success: true,
      data: result.visits,
      total: result.total
    });
  } catch (error) {
    next(error);
  }
}
