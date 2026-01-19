import { Request, Response, NextFunction } from 'express';
import { medicalReportService } from '../services/medicalReport.service.js';
import { MedicalReportStatus } from '../types/index.js';
import { BadRequestError } from '../utils/errors.js';
import { getString } from '../utils/helpers.js';

/**
 * @swagger
 * /medical-reports:
 *   post:
 *     summary: Create a new medical report for a patient
 *     description: |
 *       Create a new medical report for a patient. **Doctors only.**
 *
 *       The report will automatically include:
 *       - Doctor's name and hospital (from MDCN verification)
 *       - Timestamp of creation
 *       - Doctor's unique ID for tracking
 *
 *       **Required fields:** patientUniqueId, title, chiefComplaint, presentIllness, diagnosis, treatment
 *     tags: [Medical Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientUniqueId
 *               - title
 *               - chiefComplaint
 *               - presentIllness
 *               - diagnosis
 *               - treatment
 *             properties:
 *               patientUniqueId:
 *                 type: string
 *                 description: Patient's unique ID (e.g., PAT_123)
 *                 example: "PAT_123"
 *               title:
 *                 type: string
 *                 description: Report title/type
 *                 example: "General Consultation"
 *               chiefComplaint:
 *                 type: string
 *                 description: Patient's main complaint
 *                 example: "Persistent headache for 3 days"
 *               presentIllness:
 *                 type: string
 *                 description: History of present illness
 *                 example: "Patient reports severe headache starting 3 days ago, worse in the morning"
 *               pastMedicalHistory:
 *                 type: string
 *                 description: Patient's past medical history
 *                 example: "Hypertension diagnosed 2019, on medication"
 *               familyHistory:
 *                 type: string
 *                 description: Relevant family medical history
 *                 example: "Father had diabetes, mother has hypertension"
 *               socialHistory:
 *                 type: string
 *                 description: Social history (smoking, alcohol, etc.)
 *                 example: "Non-smoker, occasional alcohol use"
 *               physicalExamination:
 *                 type: string
 *                 description: Physical examination findings
 *                 example: "Alert and oriented, BP 140/90, no neck stiffness"
 *               vitalSigns:
 *                 type: object
 *                 description: Patient's vital signs
 *                 properties:
 *                   bloodPressure:
 *                     type: string
 *                     example: "120/80"
 *                   heartRate:
 *                     type: number
 *                     example: 72
 *                   temperature:
 *                     type: number
 *                     description: Temperature in Celsius
 *                     example: 36.5
 *                   weight:
 *                     type: number
 *                     description: Weight in kg
 *                     example: 70
 *                   height:
 *                     type: number
 *                     description: Height in cm
 *                     example: 175
 *                   oxygenSaturation:
 *                     type: number
 *                     description: SpO2 percentage
 *                     example: 98
 *               diagnosis:
 *                 type: string
 *                 description: Primary diagnosis
 *                 example: "Tension headache"
 *               diagnosisCode:
 *                 type: string
 *                 description: ICD-10 code for the diagnosis
 *                 example: "G44.2"
 *               treatment:
 *                 type: string
 *                 description: Treatment plan
 *                 example: "Rest, hydration, and pain management"
 *               medications:
 *                 type: array
 *                 description: Prescribed medications
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Paracetamol"
 *                     dosage:
 *                       type: string
 *                       example: "500mg"
 *                     frequency:
 *                       type: string
 *                       example: "3 times daily"
 *                     duration:
 *                       type: string
 *                       example: "5 days"
 *               labResults:
 *                 type: string
 *                 description: Laboratory results if any
 *                 example: "CBC - Normal, FBS - 95mg/dL"
 *               imaging:
 *                 type: string
 *                 description: Imaging results if any
 *                 example: "CT Brain - No abnormalities detected"
 *               recommendations:
 *                 type: string
 *                 description: Doctor's recommendations
 *                 example: "Avoid stress, ensure adequate sleep, follow-up if symptoms persist"
 *               followUpDate:
 *                 type: string
 *                 format: date
 *                 description: Scheduled follow-up date
 *                 example: "2024-02-15"
 *               status:
 *                 type: string
 *                 enum: [draft, final, amended]
 *                 description: Report status (default is 'draft')
 *                 example: "final"
 *           example:
 *             patientUniqueId: "PAT_123"
 *             title: "General Consultation"
 *             chiefComplaint: "Persistent headache for 3 days"
 *             presentIllness: "Patient reports severe headache starting 3 days ago"
 *             diagnosis: "Tension headache"
 *             treatment: "Rest, hydration, and pain management"
 *             vitalSigns:
 *               bloodPressure: "120/80"
 *               heartRate: 72
 *               temperature: 36.5
 *             medications:
 *               - name: "Paracetamol"
 *                 dosage: "500mg"
 *                 frequency: "3 times daily"
 *                 duration: "5 days"
 *             status: "final"
 *     responses:
 *       201:
 *         description: Medical report created successfully
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
 *                   example: "Medical report created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/MedicalReport'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Only doctors can create reports
 *       404:
 *         description: Patient not found
 */
export async function createReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const doctorUserId = req.user!.userId;
    const {
      patientUniqueId,
      title,
      chiefComplaint,
      presentIllness,
      pastMedicalHistory,
      familyHistory,
      socialHistory,
      physicalExamination,
      vitalSigns,
      diagnosis,
      diagnosisCode,
      treatment,
      medications,
      labResults,
      imaging,
      recommendations,
      followUpDate,
      status
    } = req.body;

    if (!patientUniqueId || !title || !chiefComplaint || !presentIllness || !diagnosis || !treatment) {
      throw new BadRequestError('Missing required fields: patientUniqueId, title, chiefComplaint, presentIllness, diagnosis, treatment');
    }

    const report = await medicalReportService.createReport(doctorUserId, {
      patientUniqueId,
      title,
      chiefComplaint,
      presentIllness,
      pastMedicalHistory,
      familyHistory,
      socialHistory,
      physicalExamination,
      vitalSigns,
      diagnosis,
      diagnosisCode,
      treatment,
      medications,
      labResults,
      imaging,
      recommendations,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      status: status as MedicalReportStatus
    });

    res.status(201).json({
      success: true,
      message: 'Medical report created successfully',
      data: report
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /medical-reports/{reportId}:
 *   put:
 *     summary: Update a medical report
 *     description: |
 *       Update an existing medical report. **Only the doctor who created the report can edit it.**
 *
 *       All fields are optional - only include fields you want to update.
 *       When updating status to 'amended', the system tracks the edit history.
 *     tags: [Medical Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: The medical report ID
 *         example: "abc123xyz"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               chiefComplaint:
 *                 type: string
 *               presentIllness:
 *                 type: string
 *               diagnosis:
 *                 type: string
 *               treatment:
 *                 type: string
 *               medications:
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
 *               recommendations:
 *                 type: string
 *               followUpDate:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [draft, final, amended]
 *           example:
 *             diagnosis: "Updated diagnosis: Migraine"
 *             treatment: "Updated treatment plan"
 *             status: "amended"
 *     responses:
 *       200:
 *         description: Report updated successfully
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
 *                   example: "Medical report updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/MedicalReport'
 *       403:
 *         description: Forbidden - You can only edit reports you created
 *       404:
 *         description: Report not found
 */
export async function updateReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const doctorUserId = req.user!.userId;
    const reportId = getString(req.params.reportId);
    const updateData = req.body;

    if (updateData.followUpDate) {
      updateData.followUpDate = new Date(updateData.followUpDate);
    }

    const report = await medicalReportService.updateReport(doctorUserId, reportId, updateData);

    res.json({
      success: true,
      message: 'Medical report updated successfully',
      data: report
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /medical-reports/{reportId}:
 *   delete:
 *     summary: Delete a medical report
 *     description: |
 *       Delete an existing medical report. **Only the doctor who created the report can delete it.**
 *
 *       **Warning:** This action is irreversible. The report will be permanently deleted.
 *     tags: [Medical Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: The medical report ID to delete
 *         example: "abc123xyz"
 *     responses:
 *       200:
 *         description: Report deleted successfully
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
 *                   example: "Medical report deleted successfully"
 *       403:
 *         description: Forbidden - You can only delete reports you created
 *       404:
 *         description: Report not found
 */
export async function deleteReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const doctorUserId = req.user!.userId;
    const reportId = getString(req.params.reportId);

    await medicalReportService.deleteReport(doctorUserId, reportId);

    res.json({
      success: true,
      message: 'Medical report deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /medical-reports/search/{patientUniqueId}:
 *   get:
 *     summary: Search and get patient's medical reports
 *     description: |
 *       Search for a patient by their unique ID and retrieve all their medical reports.
 *       **Doctors only.**
 *
 *       Returns patient information along with paginated list of medical reports.
 *       Reports are sorted by creation date (newest first).
 *     tags: [Medical Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientUniqueId
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient's unique ID (format PAT_XXX)
 *         example: "PAT_123"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of reports per page
 *     responses:
 *       200:
 *         description: Patient reports retrieved successfully
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
 *                     patient:
 *                       type: object
 *                       description: Patient information
 *                       properties:
 *                         uniqueId:
 *                           type: string
 *                           example: "PAT_123"
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         age:
 *                           type: integer
 *                     reports:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MedicalReport'
 *                     total:
 *                       type: integer
 *                       description: Total number of reports
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       404:
 *         description: Patient not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function searchPatientReports(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const patientUniqueId = getString(req.params.patientUniqueId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await medicalReportService.searchPatientReports(patientUniqueId, page, limit);

    res.json({
      success: true,
      data: result,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /medical-reports/my-reports:
 *   get:
 *     summary: Get all reports created by the logged-in doctor
 *     description: |
 *       Retrieve all medical reports created by the currently logged-in doctor.
 *       **Doctors only.**
 *
 *       Reports are sorted by creation date (newest first).
 *       Use pagination parameters to navigate through large datasets.
 *     tags: [Medical Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of reports per page
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MedicalReport'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Doctors only
 */
export async function getDoctorReports(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const doctorUserId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await medicalReportService.getDoctorReports(doctorUserId, page, limit);

    res.json({
      success: true,
      data: result.reports,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /medical-reports/{reportId}:
 *   get:
 *     summary: Get a specific medical report by ID
 *     description: |
 *       Retrieve a single medical report by its ID.
 *       Requires authentication.
 *     tags: [Medical Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: The medical report ID
 *         example: "abc123xyz"
 *     responses:
 *       200:
 *         description: Report retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MedicalReport'
 *       404:
 *         description: Report not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function getReportById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const reportId = getString(req.params.reportId);

    const report = await medicalReportService.getReportById(reportId);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
}
