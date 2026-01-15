import { Request, Response, NextFunction } from 'express';
import { visitService, CreateVisitData, UpdateVisitData } from '../services/visit.service.js';
import { VisitStatus, Severity } from '../types/index.js';
import { getString, getOptionalString } from '../utils/helpers.js';

/**
 * @swagger
 * /visits:
 *   post:
 *     summary: Create a new visit
 *     tags: [Visits]
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
 *               - doctorId
 *               - hospitalId
 *               - chiefComplaint
 *               - symptoms
 *             properties:
 *               patientId:
 *                 type: string
 *               doctorId:
 *                 type: string
 *               hospitalId:
 *                 type: string
 *               chiefComplaint:
 *                 type: string
 *               symptoms:
 *                 type: array
 *                 items:
 *                   type: string
 *               notes:
 *                 type: string
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Visit created
 */
export async function createVisit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data: CreateVisitData = {
      patientId: req.body.patientId,
      doctorId: req.body.doctorId,
      hospitalId: req.body.hospitalId,
      chiefComplaint: req.body.chiefComplaint,
      symptoms: req.body.symptoms,
      notes: req.body.notes,
      scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : undefined
    };

    const visit = await visitService.createVisit(data);

    res.status(201).json({
      success: true,
      message: 'Visit created successfully',
      data: visit
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /visits/{id}:
 *   get:
 *     summary: Get visit by ID
 *     tags: [Visits]
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
 *         description: Visit retrieved
 */
export async function getVisitById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getString(req.params.id);

    const visit = await visitService.getVisitById(id);

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
 * /visits/{id}/details:
 *   get:
 *     summary: Get visit with full details (patient, doctor info)
 *     tags: [Visits]
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
 *         description: Visit details retrieved
 */
export async function getVisitWithDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getString(req.params.id);

    const details = await visitService.getVisitWithDetails(id);

    res.json({
      success: true,
      data: details
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /visits/{id}:
 *   patch:
 *     summary: Update visit
 *     tags: [Visits]
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
 *               notes:
 *                 type: string
 *               followUpDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Visit updated
 */
export async function updateVisit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getString(req.params.id);
    const data: UpdateVisitData = req.body;

    const visit = await visitService.updateVisit(id, data);

    res.json({
      success: true,
      message: 'Visit updated successfully',
      data: visit
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /visits/{id}/start:
 *   post:
 *     summary: Start a scheduled visit
 *     tags: [Visits]
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
 *         description: Visit started
 */
export async function startVisit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getString(req.params.id);

    const visit = await visitService.startVisit(id);

    res.json({
      success: true,
      message: 'Visit started',
      data: visit
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /visits/{id}/complete:
 *   post:
 *     summary: Complete a visit
 *     tags: [Visits]
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
 *               diagnosis:
 *                 type: object
 *                 properties:
 *                   code:
 *                     type: string
 *                   description:
 *                     type: string
 *                   severity:
 *                     type: string
 *                     enum: [low, medium, high, critical]
 *                   notes:
 *                     type: string
 *               notes:
 *                 type: string
 *               followUpDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Visit completed
 */
export async function completeVisit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getString(req.params.id);
    const { diagnosis, notes, followUpDate } = req.body;

    const visit = await visitService.completeVisit(
      id,
      diagnosis,
      notes,
      followUpDate ? new Date(followUpDate) : undefined
    );

    res.json({
      success: true,
      message: 'Visit completed',
      data: visit
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /visits/{id}/cancel:
 *   post:
 *     summary: Cancel a visit
 *     tags: [Visits]
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
 *         description: Visit cancelled
 */
export async function cancelVisit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getString(req.params.id);
    const { reason } = req.body;

    const visit = await visitService.cancelVisit(id, reason);

    res.json({
      success: true,
      message: 'Visit cancelled',
      data: visit
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /visits/{id}/vitals:
 *   post:
 *     summary: Record vital signs for a visit
 *     tags: [Visits]
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
 *             properties:
 *               bloodPressure:
 *                 type: string
 *                 example: "120/80"
 *               heartRate:
 *                 type: number
 *               temperature:
 *                 type: number
 *               weight:
 *                 type: number
 *               height:
 *                 type: number
 *               oxygenSaturation:
 *                 type: number
 *     responses:
 *       200:
 *         description: Vitals recorded
 */
export async function recordVitalSigns(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getString(req.params.id);
    const vitalSigns = req.body;

    const visit = await visitService.recordVitalSigns(id, vitalSigns);

    res.json({
      success: true,
      message: 'Vital signs recorded',
      data: visit
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /visits/{id}/diagnosis:
 *   post:
 *     summary: Add diagnosis to visit
 *     tags: [Visits]
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
 *               - code
 *               - description
 *               - severity
 *             properties:
 *               code:
 *                 type: string
 *                 description: ICD-10 code
 *               description:
 *                 type: string
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Diagnosis added
 */
export async function addDiagnosis(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getString(req.params.id);
    const diagnosis = {
      code: req.body.code,
      description: req.body.description,
      severity: req.body.severity as Severity,
      notes: req.body.notes
    };

    const visit = await visitService.addDiagnosis(id, diagnosis);

    res.json({
      success: true,
      message: 'Diagnosis added',
      data: visit
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /visits/hospital/{hospitalId}:
 *   get:
 *     summary: Get visits for a hospital
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hospitalId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, in_progress, completed, cancelled]
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
 *         description: Visits retrieved
 */
export async function getHospitalVisits(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const hospitalId = getString(req.params.hospitalId);
    const { date, status, page, limit } = req.query;
    const dateStr = getOptionalString(date);
    const statusStr = getOptionalString(status);

    const result = await visitService.getHospitalVisits(
      hospitalId,
      dateStr ? new Date(dateStr) : undefined,
      statusStr as VisitStatus | undefined,
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
 * /visits/doctor/{doctorId}/today:
 *   get:
 *     summary: Get doctor's visits for today
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Today's visits retrieved
 */
export async function getDoctorTodayVisits(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const doctorId = getString(req.params.doctorId);

    const visits = await visitService.getDoctorTodayVisits(doctorId);

    res.json({
      success: true,
      data: visits,
      count: visits.length
    });
  } catch (error) {
    next(error);
  }
}
