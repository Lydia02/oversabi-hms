import { Request, Response, NextFunction } from 'express';
import { appointmentService } from '../services/appointment.service.js';
import { AppointmentStatus } from '../types/index.js';
import { getString, getOptionalString } from '../utils/helpers.js';

export class AppointmentController {
  /**
   * Create a new appointment
   */
  async createAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        patientId,
        doctorId,
        hospitalId,
        departmentId,
        scheduledDate,
        scheduledTime,
        duration,
        type,
        reason,
        notes
      } = req.body;

      const appointment = await appointmentService.createAppointment({
        patientId,
        doctorId,
        hospitalId,
        departmentId,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        duration,
        type,
        reason,
        notes
      });

      res.status(201).json({
        success: true,
        message: 'Appointment created successfully',
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get appointment by ID
   */
  async getAppointmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointmentId = getString(req.params.id);
      const appointment = await appointmentService.getAppointmentById(appointmentId);

      res.json({
        success: true,
        message: 'Appointment retrieved successfully',
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update appointment
   */
  async updateAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointmentId = getString(req.params.id);
      const {
        scheduledDate,
        scheduledTime,
        duration,
        type,
        reason,
        notes
      } = req.body;

      const appointment = await appointmentService.updateAppointment(appointmentId, {
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        scheduledTime,
        duration,
        type,
        reason,
        notes
      });

      res.json({
        success: true,
        message: 'Appointment updated successfully',
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Start appointment
   */
  async startAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointmentId = getString(req.params.id);
      const appointment = await appointmentService.startAppointment(appointmentId);

      res.json({
        success: true,
        message: 'Appointment started successfully',
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Complete appointment
   */
  async completeAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointmentId = getString(req.params.id);
      const { visitId } = req.body;
      const appointment = await appointmentService.completeAppointment(appointmentId, visitId);

      res.json({
        success: true,
        message: 'Appointment completed successfully',
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointmentId = getString(req.params.id);
      const appointment = await appointmentService.cancelAppointment(appointmentId);

      res.json({
        success: true,
        message: 'Appointment cancelled successfully',
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark appointment as no-show
   */
  async markNoShow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointmentId = getString(req.params.id);
      const appointment = await appointmentService.markNoShow(appointmentId);

      res.json({
        success: true,
        message: 'Appointment marked as no-show',
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get appointments by patient
   */
  async getPatientAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = getString(req.params.patientId);
      const status = getOptionalString(req.query.status) as AppointmentStatus | undefined;
      const page = parseInt(getOptionalString(req.query.page) || '1');
      const limit = parseInt(getOptionalString(req.query.limit) || '10');

      const result = await appointmentService.getPatientAppointments(patientId, status, page, limit);

      res.json({
        success: true,
        message: 'Patient appointments retrieved successfully',
        data: result.appointments,
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
   * Get appointments by doctor
   */
  async getDoctorAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = getString(req.params.doctorId);
      const status = getOptionalString(req.query.status) as AppointmentStatus | undefined;
      const page = parseInt(getOptionalString(req.query.page) || '1');
      const limit = parseInt(getOptionalString(req.query.limit) || '10');

      const result = await appointmentService.getDoctorAppointments(doctorId, status, page, limit);

      res.json({
        success: true,
        message: 'Doctor appointments retrieved successfully',
        data: result.appointments,
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
   * Get today's appointments for a doctor
   */
  async getTodaysAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = getString(req.params.doctorId);
      const appointments = await appointmentService.getTodaysAppointments(doctorId);

      res.json({
        success: true,
        message: "Today's appointments retrieved successfully",
        data: appointments
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get today's appointments for a hospital
   */
  async getTodaysHospitalAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hospitalId = getString(req.params.hospitalId);
      const appointments = await appointmentService.getTodaysHospitalAppointments(hospitalId);

      res.json({
        success: true,
        message: "Today's hospital appointments retrieved successfully",
        data: appointments
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get upcoming appointments for a patient
   */
  async getUpcomingAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = getString(req.params.patientId);
      const limit = parseInt(getOptionalString(req.query.limit) || '5');
      const appointments = await appointmentService.getUpcomingAppointments(patientId, limit);

      res.json({
        success: true,
        message: 'Upcoming appointments retrieved successfully',
        data: appointments
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get appointments by hospital
   */
  async getHospitalAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hospitalId = getString(req.params.hospitalId);
      const status = getOptionalString(req.query.status) as AppointmentStatus | undefined;
      const page = parseInt(getOptionalString(req.query.page) || '1');
      const limit = parseInt(getOptionalString(req.query.limit) || '10');

      const result = await appointmentService.getHospitalAppointments(hospitalId, status, page, limit);

      res.json({
        success: true,
        message: 'Hospital appointments retrieved successfully',
        data: result.appointments,
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

export const appointmentController = new AppointmentController();
