import { collections } from '../config/firebase.js';
import {
  Consent,
  ConsentStatus,
  ConsentScope,
  AccessLog,
  UserRole
} from '../types/index.js';
import { generateId } from '../utils/helpers.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors.js';
import { patientService } from './patient.service.js';

export interface GrantConsentData {
  patientId: string;
  grantedTo: string;
  grantedToType: 'doctor' | 'hospital' | 'pharmacy' | 'lab';
  scope: ConsentScope;
  expiresAt?: Date;
}

export class ConsentService {
  /**
   * Grant consent to a provider
   */
  async grantConsent(data: GrantConsentData): Promise<Consent> {
    // Verify patient exists
    await patientService.getPatientById(data.patientId);

    // Check if consent already exists
    const existing = await collections.consents
      .where('patientId', '==', data.patientId)
      .where('grantedTo', '==', data.grantedTo)
      .where('status', '==', ConsentStatus.GRANTED)
      .limit(1)
      .get();

    if (!existing.empty) {
      // Update existing consent
      const existingConsent = existing.docs[0].data() as Consent;
      return this.updateConsent(existingConsent.id, {
        scope: data.scope,
        expiresAt: data.expiresAt
      });
    }

    const consentId = generateId();
    const now = new Date();

    const consent: Consent = {
      id: consentId,
      patientId: data.patientId,
      grantedTo: data.grantedTo,
      grantedToType: data.grantedToType,
      status: ConsentStatus.GRANTED,
      scope: data.scope,
      expiresAt: data.expiresAt,
      createdAt: now,
      updatedAt: now
    };

    await collections.consents.doc(consentId).set(consent);

    return consent;
  }

  /**
   * Revoke consent
   */
  async revokeConsent(patientId: string, consentId: string): Promise<Consent> {
    const consentDoc = await collections.consents.doc(consentId).get();

    if (!consentDoc.exists) {
      throw new NotFoundError('Consent not found');
    }

    const consent = consentDoc.data() as Consent;

    if (consent.patientId !== patientId) {
      throw new ForbiddenError('You can only revoke your own consent');
    }

    if (consent.status !== ConsentStatus.GRANTED) {
      throw new BadRequestError('Consent is not active');
    }

    const now = new Date();
    const updatedConsent: Consent = {
      ...consent,
      status: ConsentStatus.REVOKED,
      revokedAt: now,
      updatedAt: now
    };

    await collections.consents.doc(consentId).set(updatedConsent, { merge: true });

    return updatedConsent;
  }

  /**
   * Update consent scope
   */
  async updateConsent(
    consentId: string,
    data: { scope?: ConsentScope; expiresAt?: Date }
  ): Promise<Consent> {
    const consentDoc = await collections.consents.doc(consentId).get();

    if (!consentDoc.exists) {
      throw new NotFoundError('Consent not found');
    }

    const consent = consentDoc.data() as Consent;

    const updatedConsent: Consent = {
      ...consent,
      ...data,
      updatedAt: new Date()
    };

    await collections.consents.doc(consentId).set(updatedConsent, { merge: true });

    return updatedConsent;
  }

  /**
   * Check if provider has consent to access patient data
   */
  async checkConsent(
    patientId: string,
    providerId: string,
    requiredScope?: keyof ConsentScope
  ): Promise<{ hasConsent: boolean; consent?: Consent }> {
    const snapshot = await collections.consents
      .where('patientId', '==', patientId)
      .where('grantedTo', '==', providerId)
      .where('status', '==', ConsentStatus.GRANTED)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { hasConsent: false };
    }

    const consent = snapshot.docs[0].data() as Consent;

    // Check if expired
    if (consent.expiresAt && new Date(consent.expiresAt) < new Date()) {
      // Mark as expired
      await collections.consents.doc(consent.id).set({
        status: ConsentStatus.EXPIRED,
        updatedAt: new Date()
      }, { merge: true });
      return { hasConsent: false };
    }

    // Check specific scope if required
    if (requiredScope && !consent.scope[requiredScope]) {
      return { hasConsent: false, consent };
    }

    return { hasConsent: true, consent };
  }

  /**
   * Get all active consents for a patient
   */
  async getPatientConsents(patientId: string): Promise<Consent[]> {
    const snapshot = await collections.consents
      .where('patientId', '==', patientId)
      .where('status', '==', ConsentStatus.GRANTED)
      .get();

    return snapshot.docs.map(doc => doc.data() as Consent);
  }

  /**
   * Log access to patient data
   */
  async logAccess(
    patientId: string,
    accessedBy: string,
    accessedByRole: UserRole,
    action: string,
    dataAccessed: string[],
    isEmergencyAccess = false,
    ipAddress?: string
  ): Promise<AccessLog> {
    const logId = generateId();
    const now = new Date();

    const accessLog: AccessLog = {
      id: logId,
      patientId,
      accessedBy,
      accessedByRole,
      action,
      dataAccessed,
      ipAddress,
      isEmergencyAccess,
      createdAt: now,
      updatedAt: now
    };

    await collections.accessLogs.doc(logId).set(accessLog);

    return accessLog;
  }

  /**
   * Get access logs for a patient
   */
  async getPatientAccessLogs(
    patientId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AccessLog[]> {
    let query = collections.accessLogs.where('patientId', '==', patientId);

    if (startDate) {
      query = query.where('createdAt', '>=', startDate);
    }

    if (endDate) {
      query = query.where('createdAt', '<=', endDate);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();

    return snapshot.docs.map(doc => doc.data() as AccessLog);
  }

  /**
   * Grant full consent (convenience method for hospital visits)
   */
  async grantFullConsent(
    patientId: string,
    providerId: string,
    providerType: 'doctor' | 'hospital' | 'pharmacy' | 'lab',
    durationHours = 24
  ): Promise<Consent> {
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    return this.grantConsent({
      patientId,
      grantedTo: providerId,
      grantedToType: providerType,
      scope: {
        viewDiagnosis: true,
        viewMedications: true,
        viewLabResults: true,
        viewAllergies: true,
        viewFullHistory: true
      },
      expiresAt
    });
  }

  /**
   * Grant emergency access (logs specially)
   */
  async grantEmergencyAccess(
    patientId: string,
    providerId: string,
    providerType: 'doctor' | 'hospital',
    providerRole: UserRole,
    reason: string
  ): Promise<{ consent: Consent; accessLog: AccessLog }> {
    // Grant temporary full access
    const consent = await this.grantFullConsent(patientId, providerId, providerType, 4); // 4 hours

    // Log emergency access
    const accessLog = await this.logAccess(
      patientId,
      providerId,
      providerRole,
      `EMERGENCY_ACCESS: ${reason}`,
      ['emergency_profile', 'full_medical_history'],
      true
    );

    return { consent, accessLog };
  }
}

export const consentService = new ConsentService();
