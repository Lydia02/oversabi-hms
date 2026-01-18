import { collections } from '../config/firebase.js';
import {
  PatientStatistics,
  DoctorStatistics,
  VisitStatus,
  AppointmentStatus
} from '../types/index.js';
import { generateId } from '../utils/helpers.js';

export class StatisticsService {
  // ===== PATIENT STATISTICS =====

  /**
   * Get patient statistics for a period
   */
  async getPatientStatistics(
    patientId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    startDate: Date,
    endDate: Date
  ): Promise<PatientStatistics[]> {
    const snapshot = await collections.patientStatistics
      .where('patientId', '==', patientId)
      .where('period', '==', period)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .orderBy('date')
      .get();

    return snapshot.docs.map(doc => doc.data() as PatientStatistics);
  }

  /**
   * Calculate and store patient statistics
   */
  async calculatePatientDailyStats(patientId: string, date: Date): Promise<PatientStatistics> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Count visits
    const visitsSnapshot = await collections.visits
      .where('patientId', '==', patientId)
      .where('createdAt', '>=', startOfDay)
      .where('createdAt', '<=', endOfDay)
      .count()
      .get();

    // Count appointments
    const appointmentsSnapshot = await collections.appointments
      .where('patientId', '==', patientId)
      .where('scheduledDate', '>=', startOfDay)
      .where('scheduledDate', '<=', endOfDay)
      .count()
      .get();

    // Count prescriptions
    const prescriptionsSnapshot = await collections.prescriptions
      .where('patientId', '==', patientId)
      .where('createdAt', '>=', startOfDay)
      .where('createdAt', '<=', endOfDay)
      .count()
      .get();

    // Count lab tests
    const labTestsSnapshot = await collections.labTests
      .where('patientId', '==', patientId)
      .where('createdAt', '>=', startOfDay)
      .where('createdAt', '<=', endOfDay)
      .count()
      .get();

    // Count consultations
    const consultationsSnapshot = await collections.consultationRecords
      .where('patientId', '==', patientId)
      .where('createdAt', '>=', startOfDay)
      .where('createdAt', '<=', endOfDay)
      .count()
      .get();

    const now = new Date();
    const statsId = generateId();

    const stats: PatientStatistics = {
      patientId,
      period: 'daily',
      date: startOfDay,
      visitCount: visitsSnapshot.data().count,
      appointmentCount: appointmentsSnapshot.data().count,
      prescriptionCount: prescriptionsSnapshot.data().count,
      labTestCount: labTestsSnapshot.data().count,
      consultationCount: consultationsSnapshot.data().count
    };

    // Store in collection
    await collections.patientStatistics.doc(statsId).set({
      id: statsId,
      ...stats,
      createdAt: now,
      updatedAt: now
    });

    return stats;
  }

  /**
   * Get patient weekly statistics (aggregate of daily)
   */
  async getPatientWeeklyStats(patientId: string, weekStartDate: Date): Promise<PatientStatistics> {
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 7);

    const dailyStats = await this.getPatientStatistics(patientId, 'daily', weekStartDate, weekEndDate);

    return {
      patientId,
      period: 'weekly',
      date: weekStartDate,
      visitCount: dailyStats.reduce((sum, s) => sum + s.visitCount, 0),
      appointmentCount: dailyStats.reduce((sum, s) => sum + s.appointmentCount, 0),
      prescriptionCount: dailyStats.reduce((sum, s) => sum + s.prescriptionCount, 0),
      labTestCount: dailyStats.reduce((sum, s) => sum + s.labTestCount, 0),
      consultationCount: dailyStats.reduce((sum, s) => sum + s.consultationCount, 0)
    };
  }

  // ===== DOCTOR STATISTICS =====

  /**
   * Get doctor statistics for a period
   */
  async getDoctorStatistics(
    doctorId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    startDate: Date,
    endDate: Date
  ): Promise<DoctorStatistics[]> {
    const snapshot = await collections.doctorStatistics
      .where('doctorId', '==', doctorId)
      .where('period', '==', period)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .orderBy('date')
      .get();

    return snapshot.docs.map(doc => doc.data() as DoctorStatistics);
  }

  /**
   * Calculate and store doctor daily statistics
   */
  async calculateDoctorDailyStats(doctorId: string, date: Date): Promise<DoctorStatistics> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Patients seen (completed visits)
    const patientsSeenSnapshot = await collections.visits
      .where('doctorId', '==', doctorId)
      .where('status', '==', VisitStatus.COMPLETED)
      .where('createdAt', '>=', startOfDay)
      .where('createdAt', '<=', endOfDay)
      .count()
      .get();

    // Appointments completed
    const completedApptsSnapshot = await collections.appointments
      .where('doctorId', '==', doctorId)
      .where('status', '==', AppointmentStatus.COMPLETED)
      .where('scheduledDate', '>=', startOfDay)
      .where('scheduledDate', '<=', endOfDay)
      .count()
      .get();

    // Appointments cancelled
    const cancelledApptsSnapshot = await collections.appointments
      .where('doctorId', '==', doctorId)
      .where('status', '==', AppointmentStatus.CANCELLED)
      .where('scheduledDate', '>=', startOfDay)
      .where('scheduledDate', '<=', endOfDay)
      .count()
      .get();

    // Prescriptions written
    const prescriptionsSnapshot = await collections.prescriptions
      .where('doctorId', '==', doctorId)
      .where('createdAt', '>=', startOfDay)
      .where('createdAt', '<=', endOfDay)
      .count()
      .get();

    // Referrals made
    const referralsSnapshot = await collections.referrals
      .where('fromDoctorId', '==', doctorId)
      .where('createdAt', '>=', startOfDay)
      .where('createdAt', '<=', endOfDay)
      .count()
      .get();

    const now = new Date();
    const statsId = generateId();

    const stats: DoctorStatistics = {
      doctorId,
      period: 'daily',
      date: startOfDay,
      patientsSeen: patientsSeenSnapshot.data().count,
      appointmentsCompleted: completedApptsSnapshot.data().count,
      appointmentsCancelled: cancelledApptsSnapshot.data().count,
      prescriptionsWritten: prescriptionsSnapshot.data().count,
      referralsMade: referralsSnapshot.data().count
    };

    // Store in collection
    await collections.doctorStatistics.doc(statsId).set({
      id: statsId,
      ...stats,
      createdAt: now,
      updatedAt: now
    });

    return stats;
  }

  /**
   * Get doctor weekly statistics
   */
  async getDoctorWeeklyStats(doctorId: string, weekStartDate: Date): Promise<DoctorStatistics> {
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 7);

    const dailyStats = await this.getDoctorStatistics(doctorId, 'daily', weekStartDate, weekEndDate);

    return {
      doctorId,
      period: 'weekly',
      date: weekStartDate,
      patientsSeen: dailyStats.reduce((sum, s) => sum + s.patientsSeen, 0),
      appointmentsCompleted: dailyStats.reduce((sum, s) => sum + s.appointmentsCompleted, 0),
      appointmentsCancelled: dailyStats.reduce((sum, s) => sum + s.appointmentsCancelled, 0),
      prescriptionsWritten: dailyStats.reduce((sum, s) => sum + s.prescriptionsWritten, 0),
      referralsMade: dailyStats.reduce((sum, s) => sum + s.referralsMade, 0)
    };
  }

  /**
   * Get real-time patient counts (for dashboard graph)
   */
  async getPatientCountByPeriod(
    period: 'daily' | 'weekly' | 'monthly',
    count: number = 7
  ): Promise<{ date: string; count: number }[]> {
    const result: { date: string; count: number }[] = [];
    const now = new Date();

    for (let i = count - 1; i >= 0; i--) {
      let startDate: Date;
      let endDate: Date;
      let label: string;

      if (period === 'daily') {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - i);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        label = startDate.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (period === 'weekly') {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - (i * 7));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        label = `Week ${count - i}`;
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
        label = startDate.toLocaleDateString('en-US', { month: 'short' });
      }

      const snapshot = await collections.patients
        .where('createdAt', '>=', startDate)
        .where('createdAt', '<=', endDate)
        .count()
        .get();

      result.push({ date: label, count: snapshot.data().count });
    }

    return result;
  }

  /**
   * Get appointment counts for dashboard graph
   */
  async getAppointmentCountByPeriod(
    period: 'daily' | 'weekly' | 'monthly',
    count: number = 7,
    doctorId?: string
  ): Promise<{ date: string; completed: number; cancelled: number; total: number }[]> {
    const result: { date: string; completed: number; cancelled: number; total: number }[] = [];
    const now = new Date();

    for (let i = count - 1; i >= 0; i--) {
      let startDate: Date;
      let endDate: Date;
      let label: string;

      if (period === 'daily') {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - i);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        label = startDate.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (period === 'weekly') {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - (i * 7));
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        label = `Week ${count - i}`;
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        label = startDate.toLocaleDateString('en-US', { month: 'short' });
      }

      let baseQuery = collections.appointments
        .where('scheduledDate', '>=', startDate)
        .where('scheduledDate', '<=', endDate);

      if (doctorId) {
        baseQuery = baseQuery.where('doctorId', '==', doctorId);
      }

      const totalSnapshot = await baseQuery.count().get();

      const completedSnapshot = await collections.appointments
        .where('scheduledDate', '>=', startDate)
        .where('scheduledDate', '<=', endDate)
        .where('status', '==', AppointmentStatus.COMPLETED)
        .count()
        .get();

      const cancelledSnapshot = await collections.appointments
        .where('scheduledDate', '>=', startDate)
        .where('scheduledDate', '<=', endDate)
        .where('status', '==', AppointmentStatus.CANCELLED)
        .count()
        .get();

      result.push({
        date: label,
        total: totalSnapshot.data().count,
        completed: completedSnapshot.data().count,
        cancelled: cancelledSnapshot.data().count
      });
    }

    return result;
  }
}

export const statisticsService = new StatisticsService();
