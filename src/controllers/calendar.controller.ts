import { Request, Response, NextFunction } from 'express';
import { calendarService } from '../services/calendar.service.js';
import { CalendarEventType, CalendarEventStatus, UserRole } from '../types/index.js';
import { getString, getOptionalString } from '../utils/helpers.js';

export class CalendarController {
  /**
   * Create calendar event
   */
  async createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const {
        title,
        description,
        eventType,
        startDate,
        endDate,
        startTime,
        endTime,
        allDay,
        color,
        relatedPatientId,
        relatedDoctorId,
        relatedAppointmentId,
        location,
        reminder,
        isRecurring,
        recurringPattern
      } = req.body;

      const event = await calendarService.createEvent({
        userId: user.userId,
        userRole: user.role as UserRole,
        title,
        description,
        eventType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        startTime,
        endTime,
        allDay,
        color,
        relatedPatientId,
        relatedDoctorId,
        relatedAppointmentId,
        location,
        reminder,
        isRecurring,
        recurringPattern
      });

      res.status(201).json({
        success: true,
        message: 'Calendar event created successfully',
        data: event
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get event by ID
   */
  async getEventById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = getString(req.params.id);
      const event = await calendarService.getEventById(eventId);

      res.json({
        success: true,
        data: event
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update event
   */
  async updateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = getString(req.params.id);
      const {
        title,
        description,
        eventType,
        status,
        startDate,
        endDate,
        startTime,
        endTime,
        allDay,
        color,
        location,
        reminder
      } = req.body;

      const event = await calendarService.updateEvent(eventId, {
        title,
        description,
        eventType,
        status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        startTime,
        endTime,
        allDay,
        color,
        location,
        reminder
      });

      res.json({
        success: true,
        message: 'Event updated successfully',
        data: event
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete event
   */
  async deleteEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = getString(req.params.id);
      await calendarService.deleteEvent(eventId);

      res.json({
        success: true,
        message: 'Event deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get my events for date range
   */
  async getMyEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const startDate = new Date(getString(req.query.startDate as string));
      const endDate = new Date(getString(req.query.endDate as string));

      const events = await calendarService.getUserEvents(user.userId, startDate, endDate);

      res.json({
        success: true,
        data: events
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get month events
   */
  async getMonthEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const year = parseInt(getString(req.params.year));
      const month = parseInt(getString(req.params.month));

      const events = await calendarService.getMonthEvents(user.userId, year, month);

      res.json({
        success: true,
        data: events
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get day events
   */
  async getDayEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const date = new Date(getString(req.params.date));

      const events = await calendarService.getDayEvents(user.userId, date);

      res.json({
        success: true,
        data: events
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get today's events
   */
  async getTodaysEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const events = await calendarService.getTodaysEvents(user.userId);

      res.json({
        success: true,
        data: events
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const limit = parseInt(getOptionalString(req.query.limit) || '10');

      const events = await calendarService.getUpcomingEvents(user.userId, limit);

      res.json({
        success: true,
        data: events
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Complete event
   */
  async completeEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = getString(req.params.id);
      const event = await calendarService.completeEvent(eventId);

      res.json({
        success: true,
        message: 'Event completed',
        data: event
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel event
   */
  async cancelEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = getString(req.params.id);
      const event = await calendarService.cancelEvent(eventId);

      res.json({
        success: true,
        message: 'Event cancelled',
        data: event
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reschedule event
   */
  async rescheduleEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = getString(req.params.id);
      const { startDate, endDate, startTime, endTime } = req.body;

      const event = await calendarService.rescheduleEvent(
        eventId,
        new Date(startDate),
        new Date(endDate),
        startTime,
        endTime
      );

      res.json({
        success: true,
        message: 'Event rescheduled',
        data: event
      });
    } catch (error) {
      next(error);
    }
  }
}

export const calendarController = new CalendarController();
