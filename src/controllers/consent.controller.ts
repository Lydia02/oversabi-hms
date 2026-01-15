import { Request, Response, NextFunction } from 'express';
import { consentService, GrantConsentData } from '../services/consent.service.js';
import { ConsentScope, UserRole } from '../types/index.js';
import { getString, getOptionalString } from '../utils/helpers.js';

/**
 * @swagger
 * /consent/grant:
 *   post:
 *     summary: Grant consent to a provider
 *     tags: [Consent]
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
 *               - grantedTo
 *               - grantedToType
 *               - scope
 *             properties:
 *               patientId:
 *                 type: string
 *               grantedTo:
 *                 type: string
 *                 description: Provider ID (doctor, hospital, pharmacy, or lab)
 *               grantedToType:
 *                 type: string
 *                 enum: [doctor, hospital, pharmacy, lab]
 *               scope:
 *                 type: object
 *                 properties:
 *                   viewDiagnosis:
 *                     type: boolean
 *                   viewMedications:
 *                     type: boolean
 *                   viewLabResults:
 *                     type: boolean
 *                   viewAllergies:
 *                     type: boolean
 *                   viewFullHistory:
 *                     type: boolean
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Consent granted
 */
export async function grantConsent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data: GrantConsentData = {
      patientId: req.body.patientId,
      grantedTo: req.body.grantedTo,
      grantedToType: req.body.grantedToType,
      scope: req.body.scope as ConsentScope,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined
    };

    const consent = await consentService.grantConsent(data);

    res.status(201).json({
      success: true,
      message: 'Consent granted successfully',
      data: consent
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /consent/{consentId}/revoke:
 *   post:
 *     summary: Revoke a consent
 *     tags: [Consent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Consent revoked
 */
export async function revokeConsent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const consentId = getString(req.params.consentId);
    const { patientId } = req.body;

    const consent = await consentService.revokeConsent(patientId, consentId);

    res.json({
      success: true,
      message: 'Consent revoked successfully',
      data: consent
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /consent/check:
 *   get:
 *     summary: Check if provider has consent
 *     tags: [Consent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: scope
 *         schema:
 *           type: string
 *           enum: [viewDiagnosis, viewMedications, viewLabResults, viewAllergies, viewFullHistory]
 *     responses:
 *       200:
 *         description: Consent check result
 */
export async function checkConsent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const patientId = getString(req.query.patientId);
    const providerId = getString(req.query.providerId);
    const scope = getOptionalString(req.query.scope);

    const result = await consentService.checkConsent(
      patientId,
      providerId,
      scope as keyof ConsentScope | undefined
    );

    res.json({
      success: true,
      data: {
        hasConsent: result.hasConsent,
        consent: result.consent
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /consent/patient/{patientId}:
 *   get:
 *     summary: Get all active consents for a patient
 *     tags: [Consent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Consents retrieved
 */
export async function getPatientConsents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const patientId = getString(req.params.patientId);

    const consents = await consentService.getPatientConsents(patientId);

    res.json({
      success: true,
      data: consents,
      count: consents.length
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /consent/patient/{patientId}/access-logs:
 *   get:
 *     summary: Get access logs for a patient
 *     tags: [Consent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Access logs retrieved
 */
export async function getPatientAccessLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const patientId = getString(req.params.patientId);
    const startDateStr = getOptionalString(req.query.startDate);
    const endDateStr = getOptionalString(req.query.endDate);

    const logs = await consentService.getPatientAccessLogs(
      patientId,
      startDateStr ? new Date(startDateStr) : undefined,
      endDateStr ? new Date(endDateStr) : undefined
    );

    res.json({
      success: true,
      data: logs,
      count: logs.length
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /consent/grant-full:
 *   post:
 *     summary: Grant full consent for a hospital visit
 *     tags: [Consent]
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
 *               - providerId
 *               - providerType
 *             properties:
 *               patientId:
 *                 type: string
 *               providerId:
 *                 type: string
 *               providerType:
 *                 type: string
 *                 enum: [doctor, hospital, pharmacy, lab]
 *               durationHours:
 *                 type: integer
 *                 default: 24
 *     responses:
 *       201:
 *         description: Full consent granted
 */
export async function grantFullConsent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { patientId, providerId, providerType, durationHours } = req.body;

    const consent = await consentService.grantFullConsent(
      patientId,
      providerId,
      providerType,
      durationHours || 24
    );

    res.status(201).json({
      success: true,
      message: 'Full consent granted',
      data: consent
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /consent/emergency:
 *   post:
 *     summary: Grant emergency access (for unconscious patients)
 *     tags: [Consent]
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
 *               - reason
 *             properties:
 *               patientId:
 *                 type: string
 *               reason:
 *                 type: string
 *                 description: Reason for emergency access
 *     responses:
 *       201:
 *         description: Emergency access granted and logged
 */
export async function grantEmergencyAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { patientId, reason } = req.body;
    const providerId = req.user!.userId;
    const providerRole = req.user!.role;

    // Determine provider type from role
    let providerType: 'doctor' | 'hospital' = 'hospital';
    if (providerRole === UserRole.DOCTOR) {
      providerType = 'doctor';
    }

    const result = await consentService.grantEmergencyAccess(
      patientId,
      providerId,
      providerType,
      providerRole,
      reason
    );

    res.status(201).json({
      success: true,
      message: 'Emergency access granted - this action has been logged for audit',
      data: {
        consent: result.consent,
        accessLog: result.accessLog
      }
    });
  } catch (error) {
    next(error);
  }
}
