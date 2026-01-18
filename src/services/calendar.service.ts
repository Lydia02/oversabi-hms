import { collections } from '../config/firebase.js';
import {
  CalendarEvent,
  CalendarEventType,
  CalendarEventStatus,
  UserRole
} from '../types/index.js';
import { generateId } from '../utils/helpers.js';
import { NotFoundError } from '../utils/errors.js';

export interface CreateCalendarEventData {
  userId: string;
  userRole: UserRole;
  title: string;
  description?: string;
  eventType: CalendarEventType;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  allDay?: boolean;
  color?: string;
  relatedPatientId?: string;
  relatedDoctorId?: string;
  relatedAppointmentId?: string;
  location?: string;
  reminder?: number;
  isRecurring?: boolean;
  recurringPattern?: string;
}

export interface UpdateCalendarEventData {
  title?: string;
  description?: string;
  eventType?: CalendarEventType;
  status?: CalendarEventStatus;
  startDate?: Date;
  endDate?: Date;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  color?: string;
  location?: string;
  reminder?: number;
}

export class CalendarService {
  /**
   * Create a calendar event
   */
  async createEvent(data: CreateCalendarEventData): Promise<CalendarEvent> {
    const eventId = generateId();
    const now = new Date();

    const event: CalendarEvent = {
      id: eventId,
      userId: data.userId,
      userRole: data.userRole,
      title: data.title,
      description: data.description,
      eventType: data.eventType,
      status: CalendarEventStatus.SCHEDULED,
      startDate: data.startDate,
      endDate: data.endDate,
      startTime: data.startTime,
      endTime: data.endTime,
      allDay: data.allDay || false,
      color: data.color,
      relatedPatientId: data.relatedPatientId,
      relatedDoctorId: data.relatedDoctorId,
      relatedAppointmentId: data.relatedAppointmentId,
      location: data.location,
      reminder: data.reminder,
      isRecurring: data.isRecurring || false,
      recurringPattern: data.recurringPattern,
      createdAt: now,
      updatedAt: now
    };

    await collections.calendarEvents.doc(eventId).set(event);

    return event;
  }

  /**
   * Get event by ID
   */
  async getEventById(eventId: string): Promise<CalendarEvent> {
    const doc = await collections.calendarEvents.doc(eventId).get();

    if (!doc.exists) {
      throw new NotFoundError('Calendar event not found');
    }

    return doc.data() as CalendarEvent;
  }

  /**
   * Update calendar event
   */
  async updateEvent(eventId: string, data: UpdateCalendarEventData): Promise<CalendarEvent> {
    const event = await this.getEventById(eventId);

    const updatedEvent: CalendarEvent = {
      ...event,
      ...data,
      updatedAt: new Date()
    };

    await collections.calendarEvents.doc(eventId).set(updatedEvent, { merge: true });

    return updatedEvent;
  }

  /**
   * Delete calendar event
   */
  async deleteEvent(eventId: string): Promise<void> {
    await this.getEventById(eventId); // Verify exists
    await collections.calendarEvents.doc(eventId).delete();
  }

  /**
   * Get events for a user in a date range
   */
  async getUserEvents(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    const snapshot = await collections.calendarEvents
      .where('userId', '==', userId)
      .where('startDate', '>=', startDate)
      .where('startDate', '<=', endDate)
      .orderBy('startDate')
      .orderBy('startTime')
      .get();

    return snapshot.docs.map(doc => doc.data() as CalendarEvent);
  }

  /**
   * Get events for a specific month
   */
  async getMonthEvents(userId: string, year: number, month: number): Promise<CalendarEvent[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return this.getUserEvents(userId, startDate, endDate);
  }

  /**
   * Get events for a specific day
   */
  async getDayEvents(userId: string, date: Date): Promise<CalendarEvent[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.getUserEvents(userId, startOfDay, endOfDay);
  }

  /**
   * Get today's events for a user
   */
  async getTodaysEvents(userId: string): Promise<CalendarEvent[]> {
    const today = new Date();
    return this.getDayEvents(userId, today);
  }

  /**
   * Get upcoming events for a user
   */
  async getUpcomingEvents(userId: string, limit: number = 10): Promise<CalendarEvent[]> {
    const now = new Date();

    const snapshot = await collections.calendarEvents
      .where('userId', '==', userId)
      .where('startDate', '>=', now)
      .where('status', '==', CalendarEventStatus.SCHEDULED)
      .orderBy('startDate')
      .orderBy('startTime')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => doc.data() as CalendarEvent);
  }

  /**
   * Complete an event
   */
  async completeEvent(eventId: string): Promise<CalendarEvent> {
    return this.updateEvent(eventId, { status: CalendarEventStatus.COMPLETED });
  }

  /**
   * Cancel an event
   */
  async cancelEvent(eventId: string): Promise<CalendarEvent> {
    return this.updateEvent(eventId, { status: CalendarEventStatus.CANCELLED });
  }

  /**
   * Reschedule an event
   */
  async rescheduleEvent(
    eventId: string,
    newStartDate: Date,
    newEndDate: Date,
    newStartTime: string,
    newEndTime: string
  ): Promise<CalendarEvent> {
    return this.updateEvent(eventId, {
      startDate: newStartDate,
      endDate: newEndDate,
      startTime: newStartTime,
      endTime: newEndTime,
      status: CalendarEventStatus.RESCHEDULED
    });
  }

  /**
   * Get events by type
   */
  async getEventsByType(
    userId: string,
    eventType: CalendarEventType,
    startDate?: Date,
    endDate?: Date
  ): Promise<CalendarEvent[]> {
    let query = collections.calendarEvents
      .where('userId', '==', userId)
      .where('eventType', '==', eventType);

    if (startDate) {
      query = query.where('startDate', '>=', startDate);
    }
    if (endDate) {
      query = query.where('startDate', '<=', endDate);
    }

    const snapshot = await query.orderBy('startDate').get();

    return snapshot.docs.map(doc => doc.data() as CalendarEvent);
  }

  /**
   * Create event from appointment
   */
  async createEventFromAppointment(
    userId: string,
    userRole: UserRole,
    appointmentId: string,
    patientId: string,
    patientName: string,
    doctorId: string,
    scheduledDate: Date,
    scheduledTime: string,
    duration: number = 30
  ): Promise<CalendarEvent> {
    const endTime = this.calculateEndTime(scheduledTime, duration);

    return this.createEvent({
      userId,
      userRole,
      title: `Appointment with ${patientName}`,
      eventType: CalendarEventType.APPOINTMENT,
      startDate: scheduledDate,
      endDate: scheduledDate,
      startTime: scheduledTime,
      endTime,
      relatedPatientId: patientId,
      relatedDoctorId: doctorId,
      relatedAppointmentId: appointmentId,
      color: '#4CAF50'
    });
  }

  /**
   * Calculate end time based on start time and duration
   */
  private calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }
}

export const calendarService = new CalendarService();
