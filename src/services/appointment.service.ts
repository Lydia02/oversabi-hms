import { collections } from '../config/firebase.js';
import {
  Appointment,
  AppointmentStatus
} from '../types/index.js';
import { generateId, parsePagination } from '../utils/helpers.js';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors.js';

export interface CreateAppointmentData {
  patientId: string;
  doctorId: string;
  hospitalId: string;
  departmentId?: string;
  scheduledDate: Date;
  scheduledTime: string;
  duration?: number;
  type: 'consultation' | 'follow_up' | 'emergency' | 'routine_checkup';
  reason: string;
  notes?: string;
}

export interface UpdateAppointmentData {
  scheduledDate?: Date;
  scheduledTime?: string;
  duration?: number;
  type?: 'consultation' | 'follow_up' | 'emergency' | 'routine_checkup';
  reason?: string;
  notes?: string;
  status?: AppointmentStatus;
}

export class AppointmentService {
  /**
   * Create a new appointment
   */
  async createAppointment(data: CreateAppointmentData): Promise<Appointment> {
    // Check if the doctor is available at the scheduled time
    const existingAppointments = await collections.appointments
      .where('doctorId', '==', data.doctorId)
      .where('scheduledDate', '==', data.scheduledDate)
      .where('scheduledTime', '==', data.scheduledTime)
      .where('status', 'in', [AppointmentStatus.SCHEDULED, AppointmentStatus.IN_PROGRESS])
      .limit(1)
      .get();

    if (!existingAppointments.empty) {
      throw new ConflictError('Doctor already has an appointment at this time');
    }

    const appointmentId = generateId();
    const now = new Date();

    const appointment: Appointment = {
      id: appointmentId,
      patientId: data.patientId,
      doctorId: data.doctorId,
      hospitalId: data.hospitalId,
      departmentId: data.departmentId,
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime,
      duration: data.duration || 30,
      status: AppointmentStatus.SCHEDULED,
      type: data.type,
      reason: data.reason,
      notes: data.notes,
      createdAt: now,
      updatedAt: now
    };

    await collections.appointments.doc(appointmentId).set(appointment);

    return appointment;
  }

  /**
   * Get appointment by ID
   */
  async getAppointmentById(appointmentId: string): Promise<Appointment> {
    const doc = await collections.appointments.doc(appointmentId).get();

    if (!doc.exists) {
      throw new NotFoundError('Appointment not found');
    }

    return doc.data() as Appointment;
  }

  /**
   * Update appointment
   */
  async updateAppointment(appointmentId: string, data: UpdateAppointmentData): Promise<Appointment> {
    const appointment = await this.getAppointmentById(appointmentId);

    // If rescheduling, check for conflicts
    if (data.scheduledDate || data.scheduledTime) {
      const newDate = data.scheduledDate || appointment.scheduledDate;
      const newTime = data.scheduledTime || appointment.scheduledTime;

      const conflicts = await collections.appointments
        .where('doctorId', '==', appointment.doctorId)
        .where('scheduledDate', '==', newDate)
        .where('scheduledTime', '==', newTime)
        .where('status', 'in', [AppointmentStatus.SCHEDULED, AppointmentStatus.IN_PROGRESS])
        .get();

      const hasConflict = conflicts.docs.some(doc => doc.id !== appointmentId);
      if (hasConflict) {
        throw new ConflictError('Doctor already has an appointment at this time');
      }
    }

    const updatedAppointment: Appointment = {
      ...appointment,
      ...data,
      updatedAt: new Date()
    };

    await collections.appointments.doc(appointmentId).set(updatedAppointment, { merge: true });

    return updatedAppointment;
  }

  /**
   * Start an appointment (change status to in_progress)
   */
  async startAppointment(appointmentId: string): Promise<Appointment> {
    const appointment = await this.getAppointmentById(appointmentId);

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestError('Only scheduled appointments can be started');
    }

    return this.updateAppointment(appointmentId, { status: AppointmentStatus.IN_PROGRESS });
  }

  /**
   * Complete an appointment
   */
  async completeAppointment(appointmentId: string, visitId?: string): Promise<Appointment> {
    const appointment = await this.getAppointmentById(appointmentId);

    if (appointment.status !== AppointmentStatus.IN_PROGRESS) {
      throw new BadRequestError('Only in-progress appointments can be completed');
    }

    const updatedAppointment: Appointment = {
      ...appointment,
      status: AppointmentStatus.COMPLETED,
      visitId,
      updatedAt: new Date()
    };

    await collections.appointments.doc(appointmentId).set(updatedAppointment, { merge: true });

    return updatedAppointment;
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(appointmentId: string): Promise<Appointment> {
    const appointment = await this.getAppointmentById(appointmentId);

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestError('Completed appointments cannot be cancelled');
    }

    return this.updateAppointment(appointmentId, { status: AppointmentStatus.CANCELLED });
  }

  /**
   * Mark appointment as no-show
   */
  async markNoShow(appointmentId: string): Promise<Appointment> {
    const appointment = await this.getAppointmentById(appointmentId);

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestError('Only scheduled appointments can be marked as no-show');
    }

    return this.updateAppointment(appointmentId, { status: AppointmentStatus.NO_SHOW });
  }

  /**
   * Get appointments by patient
   */
  async getPatientAppointments(
    patientId: string,
    status?: AppointmentStatus,
    page?: number,
    limit?: number
  ): Promise<{ appointments: Appointment[]; total: number }> {
    const { limit: l, offset } = parsePagination(page, limit);

    let query = collections.appointments.where('patientId', '==', patientId);

    if (status) {
      query = query.where('status', '==', status);
    }

    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    const snapshot = await query
      .orderBy('scheduledDate', 'desc')
      .offset(offset)
      .limit(l)
      .get();

    const appointments = snapshot.docs.map(doc => doc.data() as Appointment);

    return { appointments, total };
  }

  /**
   * Get appointments by doctor
   */
  async getDoctorAppointments(
    doctorId: string,
    status?: AppointmentStatus,
    page?: number,
    limit?: number
  ): Promise<{ appointments: Appointment[]; total: number }> {
    const { limit: l, offset } = parsePagination(page, limit);

    let query = collections.appointments.where('doctorId', '==', doctorId);

    if (status) {
      query = query.where('status', '==', status);
    }

    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    const snapshot = await query
      .orderBy('scheduledDate', 'desc')
      .offset(offset)
      .limit(l)
      .get();

    const appointments = snapshot.docs.map(doc => doc.data() as Appointment);

    return { appointments, total };
  }

  /**
   * Get today's appointments for a doctor
   */
  async getTodaysAppointments(doctorId: string): Promise<Appointment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const snapshot = await collections.appointments
      .where('doctorId', '==', doctorId)
      .where('scheduledDate', '>=', today)
      .where('scheduledDate', '<', tomorrow)
      .orderBy('scheduledDate')
      .orderBy('scheduledTime')
      .get();

    return snapshot.docs.map(doc => doc.data() as Appointment);
  }

  /**
   * Get today's appointments for a hospital
   */
  async getTodaysHospitalAppointments(hospitalId: string): Promise<Appointment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const snapshot = await collections.appointments
      .where('hospitalId', '==', hospitalId)
      .where('scheduledDate', '>=', today)
      .where('scheduledDate', '<', tomorrow)
      .orderBy('scheduledDate')
      .orderBy('scheduledTime')
      .get();

    return snapshot.docs.map(doc => doc.data() as Appointment);
  }

  /**
   * Get upcoming appointments for a patient
   */
  async getUpcomingAppointments(patientId: string, limitCount: number = 5): Promise<Appointment[]> {
    const now = new Date();

    const snapshot = await collections.appointments
      .where('patientId', '==', patientId)
      .where('scheduledDate', '>=', now)
      .where('status', '==', AppointmentStatus.SCHEDULED)
      .orderBy('scheduledDate')
      .orderBy('scheduledTime')
      .limit(limitCount)
      .get();

    return snapshot.docs.map(doc => doc.data() as Appointment);
  }

  /**
   * Get appointments by hospital
   */
  async getHospitalAppointments(
    hospitalId: string,
    status?: AppointmentStatus,
    page?: number,
    limit?: number
  ): Promise<{ appointments: Appointment[]; total: number }> {
    const { limit: l, offset } = parsePagination(page, limit);

    let query = collections.appointments.where('hospitalId', '==', hospitalId);

    if (status) {
      query = query.where('status', '==', status);
    }

    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    const snapshot = await query
      .orderBy('scheduledDate', 'desc')
      .offset(offset)
      .limit(l)
      .get();

    const appointments = snapshot.docs.map(doc => doc.data() as Appointment);

    return { appointments, total };
  }
}

export const appointmentService = new AppointmentService();
