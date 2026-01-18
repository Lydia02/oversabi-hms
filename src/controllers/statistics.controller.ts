import { Request, Response, NextFunction } from 'express';
import { statisticsService } from '../services/statistics.service.js';
import { getString, getOptionalString } from '../utils/helpers.js';

export class StatisticsController {
  /**
   * Get patient statistics
   */
  async getPatientStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = getString(req.params.patientId);
      const period = (getOptionalString(req.query.period) || 'daily') as 'daily' | 'weekly' | 'monthly' | 'yearly';
      const startDate = new Date(getString(req.query.startDate as string));
      const endDate = new Date(getString(req.query.endDate as string));

      const stats = await statisticsService.getPatientStatistics(patientId, period, startDate, endDate);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get patient weekly statistics
   */
  async getPatientWeeklyStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = getString(req.params.patientId);
      const weekStartDate = new Date(getString(req.query.weekStart as string));

      const stats = await statisticsService.getPatientWeeklyStats(patientId, weekStartDate);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get doctor statistics
   */
  async getDoctorStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = getString(req.params.doctorId);
      const period = (getOptionalString(req.query.period) || 'daily') as 'daily' | 'weekly' | 'monthly' | 'yearly';
      const startDate = new Date(getString(req.query.startDate as string));
      const endDate = new Date(getString(req.query.endDate as string));

      const stats = await statisticsService.getDoctorStatistics(doctorId, period, startDate, endDate);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get doctor weekly statistics
   */
  async getDoctorWeeklyStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = getString(req.params.doctorId);
      const weekStartDate = new Date(getString(req.query.weekStart as string));

      const stats = await statisticsService.getDoctorWeeklyStats(doctorId, weekStartDate);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get patient count graph data
   */
  async getPatientCountGraph(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const period = (getOptionalString(req.query.period) || 'daily') as 'daily' | 'weekly' | 'monthly';
      const count = parseInt(getOptionalString(req.query.count) || '7');

      const data = await statisticsService.getPatientCountByPeriod(period, count);

      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get appointment count graph data
   */
  async getAppointmentCountGraph(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const period = (getOptionalString(req.query.period) || 'daily') as 'daily' | 'weekly' | 'monthly';
      const count = parseInt(getOptionalString(req.query.count) || '7');
      const doctorId = getOptionalString(req.query.doctorId);

      const data = await statisticsService.getAppointmentCountByPeriod(period, count, doctorId);

      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate and store daily stats for patient
   */
  async calculatePatientDailyStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = getString(req.params.patientId);
      const date = req.body.date ? new Date(req.body.date) : new Date();

      const stats = await statisticsService.calculatePatientDailyStats(patientId, date);

      res.json({
        success: true,
        message: 'Statistics calculated successfully',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate and store daily stats for doctor
   */
  async calculateDoctorDailyStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctorId = getString(req.params.doctorId);
      const date = req.body.date ? new Date(req.body.date) : new Date();

      const stats = await statisticsService.calculateDoctorDailyStats(doctorId, date);

      res.json({
        success: true,
        message: 'Statistics calculated successfully',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

export const statisticsController = new StatisticsController();
