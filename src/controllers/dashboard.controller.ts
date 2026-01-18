import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service.js';
import { getString, getOptionalString } from '../utils/helpers.js';

export class DashboardController {
  /**
   * Get main dashboard statistics
   */
  async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hospitalId = getOptionalString(req.query.hospitalId);
      const stats = await dashboardService.getDashboardStats(hospitalId);

      res.json({
        success: true,
        message: 'Dashboard statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get today's appointments with details
   */
  async getTodaysAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hospitalId = getOptionalString(req.query.hospitalId);
      const appointments = await dashboardService.getTodaysAppointmentsWithDetails(hospitalId);

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
   * Get critical patients
   */
  async getCriticalPatients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hospitalId = getOptionalString(req.query.hospitalId);
      const patients = await dashboardService.getCriticalPatients(hospitalId);

      res.json({
        success: true,
        message: 'Critical patients retrieved successfully',
        data: patients
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get department statistics for a hospital
   */
  async getDepartmentStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hospitalId = getString(req.params.hospitalId);
      const stats = await dashboardService.getDepartmentStats(hospitalId);

      res.json({
        success: true,
        message: 'Department statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get doctor statistics
   */
  async getDoctorStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hospitalId = getOptionalString(req.query.hospitalId);
      const stats = await dashboardService.getDoctorStats(hospitalId);

      res.json({
        success: true,
        message: 'Doctor statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get patient statistics
   */
  async getPatientStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hospitalId = getOptionalString(req.query.hospitalId);
      const stats = await dashboardService.getPatientStats(hospitalId);

      res.json({
        success: true,
        message: 'Patient statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
