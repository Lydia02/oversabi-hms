import { Request, Response, NextFunction } from 'express';
import { consultationService } from '../services/consultation.service.js';
import { getString, getOptionalString } from '../utils/helpers.js';

export class ConsultationController {
  /**
   * Create a new consultation record
   */
  async createConsultation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        patientId,
        doctorId,
        hospitalId,
        departmentId,
        visitId,
        appointmentId,
        consultationDate,
        symptoms,
        diagnosis,
        specialist,
        notes,
        followUpRequired,
        followUpDate
      } = req.body;

      const consultation = await consultationService.createConsultation({
        patientId,
        doctorId,
        hospitalId,
        departmentId,
        visitId,
        appointmentId,
        consultationDate: new Date(consultationDate),
        symptoms,
        diagnosis,
        specialist,
        notes,
        followUpRequired,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined
      });

      res.status(201).json({
        success: true,
        message: 'Consultation record created successfully',
        data: consultation
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get consultation by ID
   */
  async getConsultationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const consultationId = getString(req.params.id);
      const consultation = await consultationService.getConsultationById(consultationId);

      res.json({
        success: true,
        message: 'Consultation record retrieved successfully',
        data: consultation
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update consultation record
   */
  async updateConsultation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const consultationId = getString(req.params.id);
      const { symptoms, diagnosis, notes, followUpRequired, followUpDate } = req.body;

      const consultation = await consultationService.updateConsultation(consultationId, {
        symptoms,
        diagnosis,
        notes,
        followUpRequired,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined
      });

      res.json({
        success: true,
        message: 'Consultation record updated successfully',
        data: consultation
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get consultations for a patient
   */
  async getPatientConsultations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = getString(req.params.patientId);
      const page = parseInt(getOptionalString(req.query.page) || '1');
      const limit = parseInt(getOptionalString(req.query.limit) || '10');

      const result = await consultationService.getPatientConsultations(patientId, page, limit);

      res.json({
        success: true,
        message: 'Patient consultations retrieved successfully',
        data: result.consultations,
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
   * Get consultations by doctor
   */
  async getDoctorConsultations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = getString(req.params.doctorId);
      const page = parseInt(getOptionalString(req.query.page) || '1');
      const limit = parseInt(getOptionalString(req.query.limit) || '10');

      const result = await consultationService.getDoctorConsultations(doctorId, page, limit);

      res.json({
        success: true,
        message: 'Doctor consultations retrieved successfully',
        data: result.consultations,
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
   * Get consultations for a visit
   */
  async getVisitConsultations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const visitId = getString(req.params.visitId);
      const consultations = await consultationService.getVisitConsultations(visitId);

      res.json({
        success: true,
        message: 'Visit consultations retrieved successfully',
        data: consultations
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recent consultations for a patient
   */
  async getRecentConsultations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = getString(req.params.patientId);
      const limit = parseInt(getOptionalString(req.query.limit) || '10');
      const consultations = await consultationService.getRecentConsultations(patientId, limit);

      res.json({
        success: true,
        message: 'Recent consultations retrieved successfully',
        data: consultations
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get consultations requiring follow-up for a doctor
   */
  async getFollowUpRequired(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = getString(req.params.doctorId);
      const consultations = await consultationService.getFollowUpRequired(doctorId);

      res.json({
        success: true,
        message: 'Follow-up consultations retrieved successfully',
        data: consultations
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get consultations by hospital
   */
  async getHospitalConsultations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hospitalId = getString(req.params.hospitalId);
      const page = parseInt(getOptionalString(req.query.page) || '1');
      const limit = parseInt(getOptionalString(req.query.limit) || '10');

      const result = await consultationService.getHospitalConsultations(hospitalId, page, limit);

      res.json({
        success: true,
        message: 'Hospital consultations retrieved successfully',
        data: result.consultations,
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
   * Get consultations by department
   */
  async getDepartmentConsultations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departmentId = getString(req.params.departmentId);
      const page = parseInt(getOptionalString(req.query.page) || '1');
      const limit = parseInt(getOptionalString(req.query.limit) || '10');

      const result = await consultationService.getDepartmentConsultations(departmentId, page, limit);

      res.json({
        success: true,
        message: 'Department consultations retrieved successfully',
        data: result.consultations,
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
}

export const consultationController = new ConsultationController();
