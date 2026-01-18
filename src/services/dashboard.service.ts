import { collections } from '../config/firebase.js';
import {
  DashboardStats,
  DepartmentStats,
  AppointmentStatus,
  PatientStatus,
  DoctorStatus,
  Appointment,
  Patient
} from '../types/index.js';

export interface TodayAppointmentInfo {
  id: string;
  patientName: string;
  doctorName: string;
  time: string;
  status: AppointmentStatus;
}

export interface CriticalPatientInfo {
  id: string;
  patientName: string;
  condition: string;
  room?: string;
  doctorName: string;
}

export class DashboardService {
  /**
   * Get main dashboard statistics
   */
  async getDashboardStats(hospitalId?: string): Promise<DashboardStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get total patients
    let patientsQuery = collections.patients;
    const totalPatientsSnapshot = await patientsQuery.count().get();
    const totalPatients = totalPatientsSnapshot.data().count;

    // Get patients from last month for growth calculation
    const lastMonthPatientsSnapshot = await collections.patients
      .where('createdAt', '>=', startOfLastMonth)
      .where('createdAt', '<=', endOfLastMonth)
      .count()
      .get();
    const lastMonthPatients = lastMonthPatientsSnapshot.data().count;

    const thisMonthPatientsSnapshot = await collections.patients
      .where('createdAt', '>=', startOfMonth)
      .count()
      .get();
    const thisMonthPatients = thisMonthPatientsSnapshot.data().count;

    const patientGrowth = lastMonthPatients > 0
      ? Math.round(((thisMonthPatients - lastMonthPatients) / lastMonthPatients) * 100)
      : thisMonthPatients > 0 ? 100 : 0;

    // Get active doctors
    let doctorsQuery = hospitalId
      ? collections.doctors.where('hospitalId', '==', hospitalId)
      : collections.doctors;

    const activeDoctorsSnapshot = await doctorsQuery
      .where('status', 'in', [DoctorStatus.ON_DUTY, DoctorStatus.AVAILABLE])
      .count()
      .get();
    const activeDoctors = activeDoctorsSnapshot.data().count;

    // Get total doctors for growth
    const totalDoctorsSnapshot = await doctorsQuery.count().get();
    const totalDoctors = totalDoctorsSnapshot.data().count;

    // Simple doctor growth (new doctors this month vs last month)
    const doctorGrowth = totalDoctors > activeDoctors ? 2 : 0; // Simplified

    // Get today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let appointmentsQuery = hospitalId
      ? collections.appointments.where('hospitalId', '==', hospitalId)
      : collections.appointments;

    const todaysAppointmentsSnapshot = await appointmentsQuery
      .where('scheduledDate', '>=', today)
      .where('scheduledDate', '<', tomorrow)
      .count()
      .get();
    const todaysAppointments = todaysAppointmentsSnapshot.data().count;

    // Appointments growth (compare with same day last month)
    const sameDayLastMonth = new Date(today);
    sameDayLastMonth.setMonth(sameDayLastMonth.getMonth() - 1);
    const sameDayLastMonthEnd = new Date(sameDayLastMonth);
    sameDayLastMonthEnd.setDate(sameDayLastMonthEnd.getDate() + 1);

    const lastMonthSameDaySnapshot = await (hospitalId
      ? collections.appointments.where('hospitalId', '==', hospitalId)
      : collections.appointments)
      .where('scheduledDate', '>=', sameDayLastMonth)
      .where('scheduledDate', '<', sameDayLastMonthEnd)
      .count()
      .get();
    const lastMonthSameDayAppointments = lastMonthSameDaySnapshot.data().count;

    const appointmentGrowth = lastMonthSameDayAppointments > 0
      ? todaysAppointments - lastMonthSameDayAppointments
      : todaysAppointments;

    // Get pending cases (critical patients or scheduled visits not yet completed)
    const pendingCasesSnapshot = await collections.patients
      .where('status', '==', PatientStatus.CRITICAL)
      .count()
      .get();
    const pendingCases = pendingCasesSnapshot.data().count;

    // Pending cases growth
    const caseGrowth = 3; // Simplified - would need historical data

    return {
      totalPatients,
      activeDoctors,
      todaysAppointments,
      pendingCases,
      patientGrowth,
      doctorGrowth,
      appointmentGrowth,
      caseGrowth
    };
  }

  /**
   * Get today's appointments with details
   */
  async getTodaysAppointmentsWithDetails(hospitalId?: string): Promise<TodayAppointmentInfo[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let query = hospitalId
      ? collections.appointments.where('hospitalId', '==', hospitalId)
      : collections.appointments;

    const snapshot = await query
      .where('scheduledDate', '>=', today)
      .where('scheduledDate', '<', tomorrow)
      .orderBy('scheduledDate')
      .orderBy('scheduledTime')
      .limit(10)
      .get();

    const appointments: TodayAppointmentInfo[] = [];

    for (const doc of snapshot.docs) {
      const appointment = doc.data() as Appointment;

      // Get patient name
      const patientDoc = await collections.patients.doc(appointment.patientId).get();
      const patient = patientDoc.data();
      const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown';

      // Get doctor name
      const doctorDoc = await collections.doctors.doc(appointment.doctorId).get();
      const doctor = doctorDoc.data();
      const doctorName = doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Unknown';

      appointments.push({
        id: appointment.id,
        patientName,
        doctorName,
        time: appointment.scheduledTime,
        status: appointment.status
      });
    }

    return appointments;
  }

  /**
   * Get critical patients
   */
  async getCriticalPatients(hospitalId?: string): Promise<CriticalPatientInfo[]> {
    const snapshot = await collections.patients
      .where('status', '==', PatientStatus.CRITICAL)
      .limit(10)
      .get();

    const criticalPatients: CriticalPatientInfo[] = [];

    for (const doc of snapshot.docs) {
      const patient = doc.data() as Patient;

      // Get assigned doctor name
      let doctorName = 'Unassigned';
      if (patient.assignedDoctorId) {
        const doctorDoc = await collections.doctors.doc(patient.assignedDoctorId).get();
        const doctor = doctorDoc.data();
        if (doctor) {
          doctorName = `Dr. ${doctor.firstName} ${doctor.lastName}`;
        }
      }

      // Get room/bed info if available
      let room: string | undefined;
      const bedSnapshot = await collections.beds
        .where('patientId', '==', patient.id)
        .where('isOccupied', '==', true)
        .limit(1)
        .get();

      if (!bedSnapshot.empty) {
        const bed = bedSnapshot.docs[0].data();
        room = bed.wardName ? `${bed.wardName} - ${bed.bedNumber}` : bed.bedNumber;
      }

      // Get condition from chronic conditions or recent diagnosis
      const condition = patient.chronicConditions.length > 0
        ? patient.chronicConditions[0]
        : 'Critical Care';

      criticalPatients.push({
        id: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        condition,
        room,
        doctorName
      });
    }

    return criticalPatients;
  }

  /**
   * Get department statistics for hospital
   */
  async getDepartmentStats(hospitalId: string): Promise<DepartmentStats[]> {
    const departmentsSnapshot = await collections.departments
      .where('hospitalId', '==', hospitalId)
      .where('isActive', '==', true)
      .get();

    const stats: DepartmentStats[] = [];

    for (const doc of departmentsSnapshot.docs) {
      const department = doc.data();

      let headDoctor = undefined;
      if (department.headDoctorId) {
        const doctorDoc = await collections.doctors.doc(department.headDoctorId).get();
        if (doctorDoc.exists) {
          const doctor = doctorDoc.data();
          headDoctor = {
            id: doctor?.id,
            name: `Dr. ${doctor?.firstName} ${doctor?.lastName}`
          };
        }
      }

      const occupancyPercentage = department.totalBeds > 0
        ? Math.round((department.occupiedBeds / department.totalBeds) * 100)
        : 0;

      stats.push({
        departmentId: department.id,
        departmentName: department.name,
        totalDoctors: department.totalDoctors,
        totalPatients: department.totalPatients,
        totalBeds: department.totalBeds,
        occupiedBeds: department.occupiedBeds,
        occupancyPercentage,
        headDoctor
      });
    }

    return stats;
  }

  /**
   * Get doctor statistics
   */
  async getDoctorStats(hospitalId?: string): Promise<{
    totalDoctors: number;
    onDuty: number;
    available: number;
    offDuty: number;
  }> {
    let query = hospitalId
      ? collections.doctors.where('hospitalId', '==', hospitalId)
      : collections.doctors;

    const totalSnapshot = await query.count().get();
    const totalDoctors = totalSnapshot.data().count;

    const onDutySnapshot = await (hospitalId
      ? collections.doctors.where('hospitalId', '==', hospitalId)
      : collections.doctors)
      .where('status', '==', DoctorStatus.ON_DUTY)
      .count()
      .get();
    const onDuty = onDutySnapshot.data().count;

    const availableSnapshot = await (hospitalId
      ? collections.doctors.where('hospitalId', '==', hospitalId)
      : collections.doctors)
      .where('status', '==', DoctorStatus.AVAILABLE)
      .count()
      .get();
    const available = availableSnapshot.data().count;

    const offDuty = totalDoctors - onDuty - available;

    return { totalDoctors, onDuty, available, offDuty };
  }

  /**
   * Get patient statistics
   */
  async getPatientStats(hospitalId?: string): Promise<{
    totalPatients: number;
    active: number;
    critical: number;
    admitted: number;
    discharged: number;
  }> {
    const totalSnapshot = await collections.patients.count().get();
    const totalPatients = totalSnapshot.data().count;

    const activeSnapshot = await collections.patients
      .where('status', '==', PatientStatus.ACTIVE)
      .count()
      .get();
    const active = activeSnapshot.data().count;

    const criticalSnapshot = await collections.patients
      .where('status', '==', PatientStatus.CRITICAL)
      .count()
      .get();
    const critical = criticalSnapshot.data().count;

    const admittedSnapshot = await collections.patients
      .where('status', '==', PatientStatus.ADMITTED)
      .count()
      .get();
    const admitted = admittedSnapshot.data().count;

    const discharged = totalPatients - active - critical - admitted;

    return { totalPatients, active, critical, admitted, discharged };
  }
}

export const dashboardService = new DashboardService();
