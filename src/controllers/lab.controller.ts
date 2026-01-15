import { Request, Response, NextFunction } from 'express';
import { labService, CreateLabCenterData, CreateLabTechnicianData, CreateLabTestData, LabResultData } from '../services/lab.service.js';
import { LabTestStatus } from '../types/index.js';
import { getString } from '../utils/helpers.js';

/**
 * @swagger
 * /lab/centers:
 *   post:
 *     summary: Create a new lab center
 *     tags: [Lab]
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
 *               - servicesOffered
 *             properties:
 *               name:
 *                 type: string
 *               hospitalId:
 *                 type: string
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
 *               servicesOffered:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Lab center created
 */
export async function createLabCenter(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data: CreateLabCenterData = req.body;

    const labCenter = await labService.createLabCenter(data);

    res.status(201).json({
      success: true,
      message: 'Lab center created successfully',
      data: labCenter
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /lab/centers:
 *   get:
 *     summary: Get all lab centers
 *     tags: [Lab]
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
 *         description: Lab centers retrieved
 */
export async function getLabCenters(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(getString(req.query.page)) || 1;
    const limit = parseInt(getString(req.query.limit)) || 10;

    const result = await labService.getLabCenters(page, limit);

    res.json({
      success: true,
      data: result.labCenters,
      total: result.total
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /lab/centers/{id}:
 *   get:
 *     summary: Get lab center by ID
 *     tags: [Lab]
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
 *         description: Lab center retrieved
 */
export async function getLabCenterById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getString(req.params.id);

    const labCenter = await labService.getLabCenterById(id);

    res.json({
      success: true,
      data: labCenter
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /lab/centers/{id}/stats:
 *   get:
 *     summary: Get lab center statistics
 *     tags: [Lab]
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
 *         description: Statistics retrieved
 */
export async function getLabCenterStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getString(req.params.id);

    const stats = await labService.getLabCenterStats(id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /lab/technicians:
 *   post:
 *     summary: Create a new lab technician profile
 *     tags: [Lab]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - labCenterId
 *               - firstName
 *               - lastName
 *               - specialization
 *               - licenseNumber
 *             properties:
 *               labCenterId:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               specialization:
 *                 type: string
 *               licenseNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Lab technician profile created
 */
export async function createLabTechnician(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const data: CreateLabTechnicianData = {
      userId,
      ...req.body
    };

    const technician = await labService.createLabTechnician(data);

    res.status(201).json({
      success: true,
      message: 'Lab technician profile created successfully',
      data: technician
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /lab/technicians/me:
 *   get:
 *     summary: Get current lab technician's profile
 *     tags: [Lab]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lab technician profile retrieved
 */
export async function getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    const technician = await labService.getLabTechnicianByUserId(userId);

    res.json({
      success: true,
      data: technician
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /lab/centers/{labCenterId}/technicians:
 *   get:
 *     summary: Get lab technicians by lab center
 *     tags: [Lab]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: labCenterId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lab technicians retrieved
 */
export async function getLabTechniciansByCenter(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const labCenterId = getString(req.params.labCenterId);

    const technicians = await labService.getLabTechniciansByCenter(labCenterId);

    res.json({
      success: true,
      data: technicians,
      count: technicians.length
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /lab/tests:
 *   post:
 *     summary: Create a lab test order
 *     tags: [Lab]
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
 *               - orderedBy
 *               - testType
 *               - testName
 *             properties:
 *               visitId:
 *                 type: string
 *               patientId:
 *                 type: string
 *               orderedBy:
 *                 type: string
 *                 description: Doctor ID
 *               labCenterId:
 *                 type: string
 *               testType:
 *                 type: string
 *                 description: Category of test (blood, urine, imaging, etc.)
 *               testName:
 *                 type: string
 *                 description: Specific test name (CBC, Lipid Panel, etc.)
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Lab test created
 */
export async function createLabTest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data: CreateLabTestData = req.body;

    const test = await labService.createLabTest(data);

    res.status(201).json({
      success: true,
      message: 'Lab test ordered successfully',
      data: test
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /lab/tests/{id}:
 *   get:
 *     summary: Get lab test by ID
 *     tags: [Lab]
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
 *         description: Lab test retrieved
 */
export async function getLabTestById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getString(req.params.id);

    const test = await labService.getLabTestById(id);

    res.json({
      success: true,
      data: test
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /lab/patient/{healthId}/tests:
 *   get:
 *     summary: Get patient's lab tests by Health ID
 *     tags: [Lab]
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
 *         description: Patient lab tests retrieved
 */
export async function getPatientLabTestsByHealthId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const healthId = getString(req.params.healthId);

    const result = await labService.getPatientLabTestsByHealthId(healthId);

    res.json({
      success: true,
      data: {
        patient: {
          id: result.patient.id,
          healthId: result.patient.healthId,
          name: `${result.patient.firstName} ${result.patient.lastName}`
        },
        tests: result.tests
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /lab/patient/{patientId}/tests:
 *   get:
 *     summary: Get patient's lab tests by Patient ID
 *     tags: [Lab]
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
 *         description: Patient lab tests retrieved
 */
export async function getPatientLabTests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const patientId = getString(req.params.patientId);
    const page = parseInt(getString(req.query.page)) || 1;
    const limit = parseInt(getString(req.query.limit)) || 10;

    const result = await labService.getPatientLabTests(patientId, page, limit);

    res.json({
      success: true,
      data: result.tests,
      total: result.total
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /lab/centers/{labCenterId}/tests/pending:
 *   get:
 *     summary: Get pending lab tests for a lab center
 *     tags: [Lab]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: labCenterId
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
 *         description: Pending lab tests retrieved
 */
export async function getPendingLabTests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const labCenterId = getString(req.params.labCenterId);
    const page = parseInt(getString(req.query.page)) || 1;
    const limit = parseInt(getString(req.query.limit)) || 10;

    const result = await labService.getPendingLabTests(labCenterId, page, limit);

    res.json({
      success: true,
      data: result.tests,
      total: result.total
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /lab/tests/{id}/collect-sample:
 *   post:
 *     summary: Mark sample as collected for a lab test
 *     tags: [Lab]
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
 *         description: Sample collected
 */
export async function collectSample(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getString(req.params.id);

    const test = await labService.collectSample(id);

    res.json({
      success: true,
      message: 'Sample collected successfully',
      data: test
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /lab/tests/{id}/start-processing:
 *   post:
 *     summary: Start processing a lab test
 *     tags: [Lab]
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
 *         description: Processing started
 */
export async function startProcessing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getString(req.params.id);

    const test = await labService.startProcessing(id);

    res.json({
      success: true,
      message: 'Processing started',
      data: test
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /lab/tests/{id}/complete:
 *   post:
 *     summary: Complete lab test with results
 *     tags: [Lab]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - values
 *               - verifiedBy
 *             properties:
 *               values:
 *                 type: object
 *                 description: Key-value pairs of test results
 *                 additionalProperties:
 *                   oneOf:
 *                     - type: string
 *                     - type: number
 *               interpretation:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: URLs to attached files/images
 *               verifiedBy:
 *                 type: string
 *                 description: Lab technician ID
 *     responses:
 *       200:
 *         description: Lab test completed
 */
export async function completeLabTest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getString(req.params.id);
    const resultData: LabResultData = req.body;

    const test = await labService.completeLabTest(id, resultData);

    res.json({
      success: true,
      message: 'Lab test completed successfully',
      data: test
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /lab/tests/{id}/cancel:
 *   post:
 *     summary: Cancel a lab test
 *     tags: [Lab]
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
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lab test cancelled
 */
export async function cancelLabTest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getString(req.params.id);
    const { reason } = req.body;

    const test = await labService.cancelLabTest(id, reason);

    res.json({
      success: true,
      message: 'Lab test cancelled',
      data: test
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /lab/tests/{id}/assign:
 *   post:
 *     summary: Assign lab test to a lab center
 *     tags: [Lab]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - labCenterId
 *             properties:
 *               labCenterId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lab test assigned
 */
export async function assignToLabCenter(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getString(req.params.id);
    const { labCenterId } = req.body;

    const test = await labService.assignToLabCenter(id, labCenterId);

    res.json({
      success: true,
      message: 'Lab test assigned to lab center',
      data: test
    });
  } catch (error) {
    next(error);
  }
}
