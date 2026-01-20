import { Request, Response, NextFunction } from 'express';
import { mdcnService } from '../services/mdcn.service.js';
import { getString } from '../utils/helpers.js';

/**
 * @swagger
 * /mdcn/seed:
 *   post:
 *     summary: Seed the database with sample MDCN records
 *     description: |
 *       **Development/Testing only.**
 *
 *       Seeds the database with 5 sample MDCN records for testing purposes.
 *       Use this endpoint to populate the MDCN database before testing doctor registration.
 *
 *       **Note:** This will add the following hospitals:
 *       - Lagos University Teaching Hospital (LUTH)
 *       - National Hospital Abuja
 *       - University of Nigeria Teaching Hospital (UNTH)
 *       - Ahmadu Bello University Teaching Hospital (ABUTH)
 *       - University College Hospital (UCH) Ibadan
 *     tags: [MDCN]
 *     responses:
 *       200:
 *         description: MDCN records seeded successfully
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
 *                   example: "MDCN records seeded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       description: Number of records seeded
 *                       example: 5
 */
export async function seedMDCNRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await mdcnService.seedMDCNRecords();

    res.json({
      success: true,
      message: result.message,
      data: { count: result.count }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /mdcn/verify/{mdcnNumber}:
 *   get:
 *     summary: Verify an MDCN number
 *     description: |
 *       Verify if an MDCN (Medical and Dental Council of Nigeria) number is valid and active.
 *
 *       **Use cases:**
 *       - During doctor registration to validate MDCN number
 *       - To look up doctor information by their MDCN number
 *
 *       **Returns:** Doctor and hospital information if MDCN is valid and active.
 *     tags: [MDCN]
 *     parameters:
 *       - in: path
 *         name: mdcnNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: MDCN number to verify (format MDCN/YEAR/NUMBER)
 *         example: "MDCN/2020/12345"
 *     responses:
 *       200:
 *         description: MDCN verified successfully
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
 *                   example: "MDCN number verified successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     mdcnNumber:
 *                       type: string
 *                       example: "MDCN/2020/12345"
 *                     doctorName:
 *                       type: string
 *                       example: "Dr. Adebayo Ogunleye"
 *                     hospitalName:
 *                       type: string
 *                       example: "Lagos University Teaching Hospital"
 *                     hospitalAddress:
 *                       type: string
 *                       example: "Idi-Araba, Lagos"
 *                     specialization:
 *                       type: string
 *                       example: "General Practice"
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-12-31T23:59:59.000Z"
 *       400:
 *         description: MDCN is inactive or expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "MDCN number is inactive or has expired"
 *               code: "BAD_REQUEST"
 *       404:
 *         description: MDCN not found in the database
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "MDCN number not found"
 *               code: "NOT_FOUND"
 */
export async function verifyMDCN(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const mdcnNumber = getString(req.params.mdcnNumber);

    const mdcnRecord = await mdcnService.verifyMDCN(mdcnNumber);

    res.json({
      success: true,
      message: 'MDCN number verified successfully',
      data: {
        mdcnNumber: mdcnRecord.mdcnNumber,
        doctorName: mdcnRecord.doctorName,
        hospitalName: mdcnRecord.hospitalName,
        hospitalAddress: mdcnRecord.hospitalAddress,
        specialization: mdcnRecord.specialization,
        isActive: mdcnRecord.isActive,
        expiresAt: mdcnRecord.expiresAt
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /mdcn/sample-numbers:
 *   get:
 *     summary: Get all 15 sample MDCN numbers (static list)
 *     description: |
 *       Returns a static list of all 15 sample MDCN numbers available in the system.
 *
 *       **Note:** This is a reference list. Some may already be used.
 *       Use `/mdcn/available` to get only unused MDCN numbers.
 *     tags: [MDCN]
 *     responses:
 *       200:
 *         description: List of all sample MDCN numbers
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
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       mdcnNumber:
 *                         type: string
 *                       hospitalName:
 *                         type: string
 *                       specialization:
 *                         type: string
 */
export async function getSampleMDCNNumbers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sampleNumbers = mdcnService.getSampleMDCNNumbers();

    res.json({
      success: true,
      message: 'All 15 sample MDCN numbers (some may already be used)',
      data: sampleNumbers
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /mdcn/available:
 *   get:
 *     summary: Get available (unused) MDCN numbers for registration
 *     description: |
 *       Returns a list of MDCN numbers that have NOT been used for registration yet.
 *
 *       **Use this endpoint** to get valid MDCN numbers for doctor registration.
 *       Each MDCN can only be used once - once a doctor registers with it, it becomes unavailable.
 *
 *       **Important:** Call `/mdcn/seed` first to populate the database with 15 MDCN records.
 *     tags: [MDCN]
 *     responses:
 *       200:
 *         description: List of available MDCN numbers
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
 *                   example: "12 MDCN numbers available for registration"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       mdcnNumber:
 *                         type: string
 *                         example: "MDCN/2020/12345"
 *                       hospitalName:
 *                         type: string
 *                         example: "Lagos University Teaching Hospital (LUTH)"
 *                       specialization:
 *                         type: string
 *                         example: "General Surgery"
 */
export async function getAvailableMDCNNumbers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const availableNumbers = await mdcnService.getAvailableMDCNNumbers();

    res.json({
      success: true,
      message: `${availableNumbers.length} MDCN numbers available for registration`,
      data: availableNumbers
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /mdcn:
 *   get:
 *     summary: Get all MDCN records
 *     description: |
 *       Retrieve all MDCN records from the database.
 *       **Admin and Hospital Admin only.**
 *
 *       Returns complete list of all registered MDCN records including doctor and hospital information.
 *     tags: [MDCN]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all MDCN records
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       mdcnNumber:
 *                         type: string
 *                         example: "MDCN/2020/12345"
 *                       doctorName:
 *                         type: string
 *                         example: "Dr. Adebayo Ogunleye"
 *                       hospitalName:
 *                         type: string
 *                         example: "Lagos University Teaching Hospital"
 *                       hospitalAddress:
 *                         type: string
 *                         example: "Idi-Araba, Lagos"
 *                       specialization:
 *                         type: string
 *                         example: "General Practice"
 *                       isActive:
 *                         type: boolean
 *                       registeredAt:
 *                         type: string
 *                         format: date-time
 *                       expiresAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 */
export async function getAllMDCNRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const records = await mdcnService.getAllMDCNRecords();

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    next(error);
  }
}
