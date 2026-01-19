import { Request, Response, NextFunction } from 'express';
import { medicalReportService } from '../services/medicalReport.service.js';
import { pdfService } from '../services/pdf.service.js';
import { ForbiddenError } from '../utils/errors.js';
import { getString } from '../utils/helpers.js';

/**
 * @swagger
 * /patient-reports:
 *   get:
 *     summary: Get all medical reports for the logged-in patient
 *     description: |
 *       Retrieve all medical reports for the currently logged-in patient.
 *       **Patients only.**
 *
 *       Returns a paginated list of all medical reports created by doctors for this patient.
 *       Reports are sorted by creation date (newest first).
 *     tags: [Patient Reports]
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
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Only patients can access this endpoint
 */
export async function getMyReports(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const patientUserId = req.user!.userId;
    const userRole = req.user!.role;

    if (userRole !== 'patient') {
      throw new ForbiddenError('Only patients can access their own reports');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await medicalReportService.getPatientOwnReports(patientUserId, page, limit);

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
 * /patient-reports/{reportId}:
 *   get:
 *     summary: Get a specific medical report for the logged-in patient
 *     description: |
 *       Retrieve a specific medical report by ID for the currently logged-in patient.
 *       **Patients only.**
 *
 *       The patient can only view reports that belong to them.
 *     tags: [Patient Reports]
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
 *       403:
 *         description: Forbidden - You can only view your own reports
 *       404:
 *         description: Report not found
 */
export async function getMyReportById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const patientUserId = req.user!.userId;
    const userRole = req.user!.role;
    const reportId = getString(req.params.reportId);

    if (userRole !== 'patient') {
      throw new ForbiddenError('Only patients can access their own reports');
    }

    const report = await medicalReportService.getPatientReportById(patientUserId, reportId);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /patient-reports/{reportId}/download:
 *   get:
 *     summary: Download a medical report as PDF
 *     description: |
 *       Download a specific medical report as a PDF file.
 *       **Patients only.**
 *
 *       The PDF includes:
 *       - Hospital and doctor information
 *       - Patient details
 *       - Complete medical report with all sections
 *       - Medications and prescriptions
 *       - Recommendations and follow-up date
 *
 *       **Response:** Binary PDF file
 *     tags: [Patient Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: The medical report ID to download
 *         example: "abc123xyz"
 *     responses:
 *       200:
 *         description: PDF file downloaded successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             schema:
 *               type: string
 *             description: Attachment with filename
 *             example: 'attachment; filename="medical-report-abc123xyz.pdf"'
 *           Content-Type:
 *             schema:
 *               type: string
 *             description: MIME type
 *             example: 'application/pdf'
 *       403:
 *         description: Forbidden - You can only download your own reports
 *       404:
 *         description: Report not found
 */
export async function downloadReportPDF(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const patientUserId = req.user!.userId;
    const userRole = req.user!.role;
    const reportId = getString(req.params.reportId);

    if (userRole !== 'patient') {
      throw new ForbiddenError('Only patients can download their own reports');
    }

    const report = await medicalReportService.getPatientReportById(patientUserId, reportId);

    const pdfBuffer = await pdfService.generateMedicalReportPDF(report);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="medical-report-${report.id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /patient-reports/download-all:
 *   get:
 *     summary: Download all medical reports as a single PDF
 *     description: |
 *       Download all medical reports for the logged-in patient as a single consolidated PDF file.
 *       **Patients only.**
 *
 *       The PDF includes:
 *       - Cover page with patient information
 *       - Table of contents
 *       - All medical reports in chronological order
 *       - Each report on a separate page
 *
 *       **Use case:** For sharing complete medical history with a new doctor or hospital.
 *
 *       **Response:** Binary PDF file
 *     tags: [Patient Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: PDF file containing all reports downloaded successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             schema:
 *               type: string
 *             description: Attachment with filename
 *             example: 'attachment; filename="medical-history-PAT_123.pdf"'
 *           Content-Type:
 *             schema:
 *               type: string
 *             description: MIME type
 *             example: 'application/pdf'
 *       403:
 *         description: Forbidden - Only patients can access this endpoint
 *       404:
 *         description: No medical reports found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "No medical reports found"
 */
export async function downloadAllReportsPDF(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const patientUserId = req.user!.userId;
    const userRole = req.user!.role;

    if (userRole !== 'patient') {
      throw new ForbiddenError('Only patients can download their own reports');
    }

    // Get all reports (no pagination for PDF generation)
    const result = await medicalReportService.getPatientOwnReports(patientUserId, 1, 1000);

    if (result.reports.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No medical reports found'
      });
      return;
    }

    // Get patient name from first report
    const patientName = result.reports[0].patientName;
    const patientUniqueId = result.reports[0].patientUniqueId;

    const pdfBuffer = await pdfService.generatePatientHistoryPDF(
      patientName,
      patientUniqueId,
      result.reports
    );

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="medical-history-${patientUniqueId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}
