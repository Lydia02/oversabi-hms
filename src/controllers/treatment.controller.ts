import { Request, Response, NextFunction } from 'express';
import { treatmentService } from '../services/treatment.service.js';
import { Severity } from '../types/index.js';
import { getString, getOptionalString } from '../utils/helpers.js';

export class TreatmentController {
  // ===== TREATMENT ENDPOINTS =====

  /**
   * Create treatment
   */
  async createTreatment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        patientId,
        doctorId,
        hospitalId,
        visitId,
        complaint,
        symptoms,
        examination,
        diagnosis,
        treatmentPlan,
        medications,
        procedures,
        followUpDate,
        notes
      } = req.body;

      const treatment = await treatmentService.createTreatment({
        patientId,
        doctorId,
        hospitalId,
        visitId,
        complaint,
        symptoms,
        examination,
        diagnosis,
        treatmentPlan,
        medications,
        procedures,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
        notes
      });

      res.status(201).json({
        success: true,
        message: 'Treatment created successfully',
        data: treatment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get treatment by ID
   */
  async getTreatmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const treatmentId = getString(req.params.id);
      const treatment = await treatmentService.getTreatmentById(treatmentId);

      res.json({
        success: true,
        data: treatment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update treatment
   */
  async updateTreatment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const treatmentId = getString(req.params.id);
      const {
        examination,
        diagnosis,
        treatmentPlan,
        medications,
        procedures,
        followUpDate,
        notes,
        status
      } = req.body;

      const treatment = await treatmentService.updateTreatment(treatmentId, {
        examination,
        diagnosis,
        treatmentPlan,
        medications,
        procedures,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
        notes,
        status
      });

      res.json({
        success: true,
        message: 'Treatment updated successfully',
        data: treatment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get patient treatments
   */
  async getPatientTreatments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = getString(req.params.patientId);
      const status = getOptionalString(req.query.status) as 'ongoing' | 'completed' | 'discontinued' | undefined;
      const page = parseInt(getOptionalString(req.query.page) || '1');
      const limit = parseInt(getOptionalString(req.query.limit) || '10');

      const result = await treatmentService.getPatientTreatments(patientId, status, page, limit);

      res.json({
        success: true,
        data: result.treatments,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get doctor treatments
   */
  async getDoctorTreatments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = getString(req.params.doctorId);
      const page = parseInt(getOptionalString(req.query.page) || '1');
      const limit = parseInt(getOptionalString(req.query.limit) || '10');

      const result = await treatmentService.getDoctorTreatments(doctorId, page, limit);

      res.json({
        success: true,
        data: result.treatments,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active treatments for patient
   */
  async getActiveTreatments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = getString(req.params.patientId);
      const treatments = await treatmentService.getActiveTreatments(patientId);

      res.json({
        success: true,
        data: treatments
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Complete treatment
   */
  async completeTreatment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const treatmentId = getString(req.params.id);
      const treatment = await treatmentService.completeTreatment(treatmentId);

      res.json({
        success: true,
        message: 'Treatment completed',
        data: treatment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Discontinue treatment
   */
  async discontinueTreatment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const treatmentId = getString(req.params.id);
      const { notes } = req.body;
      const treatment = await treatmentService.discontinueTreatment(treatmentId, notes);

      res.json({
        success: true,
        message: 'Treatment discontinued',
        data: treatment
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== COMPLAINT ENDPOINTS =====

  /**
   * Create complaint
   */
  async createComplaint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        patientId,
        complaint,
        description,
        severity,
        onsetDate,
        duration,
        relatedSymptoms,
        previousTreatment,
        attachments
      } = req.body;

      const complaintRecord = await treatmentService.createComplaint({
        patientId,
        complaint,
        description,
        severity: severity as Severity,
        onsetDate: new Date(onsetDate),
        duration,
        relatedSymptoms,
        previousTreatment,
        attachments
      });

      res.status(201).json({
        success: true,
        message: 'Complaint submitted successfully',
        data: complaintRecord
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get complaint by ID
   */
  async getComplaintById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const complaintId = getString(req.params.id);
      const complaint = await treatmentService.getComplaintById(complaintId);

      res.json({
        success: true,
        data: complaint
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get patient complaints
   */
  async getPatientComplaints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = getString(req.params.patientId);
      const status = getOptionalString(req.query.status) as 'pending' | 'reviewed' | 'addressed' | undefined;
      const page = parseInt(getOptionalString(req.query.page) || '1');
      const limit = parseInt(getOptionalString(req.query.limit) || '10');

      const result = await treatmentService.getPatientComplaints(patientId, status, page, limit);

      res.json({
        success: true,
        data: result.complaints,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Review complaint
   */
  async reviewComplaint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const complaintId = getString(req.params.id);
      const complaint = await treatmentService.reviewComplaint(complaintId, user.userId);

      res.json({
        success: true,
        message: 'Complaint reviewed',
        data: complaint
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Address complaint
   */
  async addressComplaint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const complaintId = getString(req.params.id);
      const complaint = await treatmentService.addressComplaint(complaintId, user.userId);

      res.json({
        success: true,
        message: 'Complaint addressed',
        data: complaint
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pending complaints
   */
  async getPendingComplaints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hospitalId = getOptionalString(req.query.hospitalId);
      const complaints = await treatmentService.getPendingComplaints(hospitalId);

      res.json({
        success: true,
        data: complaints
      });
    } catch (error) {
      next(error);
    }
  }
}

export const treatmentController = new TreatmentController();
