import { collections } from '../config/firebase.js';
import {
  Department,
  Bed,
  DepartmentStats
} from '../types/index.js';
import { generateId } from '../utils/helpers.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

export interface CreateDepartmentData {
  hospitalId: string;
  name: string;
  description?: string;
  headDoctorId?: string;
  totalBeds: number;
  icon?: string;
  color?: string;
}

export interface UpdateDepartmentData {
  name?: string;
  description?: string;
  headDoctorId?: string;
  totalBeds?: number;
  icon?: string;
  color?: string;
  isActive?: boolean;
}

export interface CreateBedData {
  departmentId: string;
  hospitalId: string;
  bedNumber: string;
  wardName?: string;
}

export class DepartmentService {
  /**
   * Create a new department
   */
  async createDepartment(data: CreateDepartmentData): Promise<Department> {
    // Check if department with same name exists in the hospital
    const existing = await collections.departments
      .where('hospitalId', '==', data.hospitalId)
      .where('name', '==', data.name)
      .limit(1)
      .get();

    if (!existing.empty) {
      throw new ConflictError('Department with this name already exists in the hospital');
    }

    const departmentId = generateId();
    const now = new Date();

    const department: Department = {
      id: departmentId,
      hospitalId: data.hospitalId,
      name: data.name,
      description: data.description,
      headDoctorId: data.headDoctorId,
      totalBeds: data.totalBeds,
      occupiedBeds: 0,
      totalDoctors: 0,
      totalPatients: 0,
      icon: data.icon,
      color: data.color,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    await collections.departments.doc(departmentId).set(department);

    return department;
  }

  /**
   * Get department by ID
   */
  async getDepartmentById(departmentId: string): Promise<Department> {
    const doc = await collections.departments.doc(departmentId).get();

    if (!doc.exists) {
      throw new NotFoundError('Department not found');
    }

    return doc.data() as Department;
  }

  /**
   * Get all departments for a hospital
   */
  async getDepartmentsByHospital(hospitalId: string): Promise<Department[]> {
    const snapshot = await collections.departments
      .where('hospitalId', '==', hospitalId)
      .where('isActive', '==', true)
      .get();

    return snapshot.docs.map(doc => doc.data() as Department);
  }

  /**
   * Update department
   */
  async updateDepartment(departmentId: string, data: UpdateDepartmentData): Promise<Department> {
    const department = await this.getDepartmentById(departmentId);

    const updatedDepartment: Department = {
      ...department,
      ...data,
      updatedAt: new Date()
    };

    await collections.departments.doc(departmentId).set(updatedDepartment, { merge: true });

    return updatedDepartment;
  }

  /**
   * Update department statistics (doctors, patients, beds)
   */
  async updateDepartmentStats(departmentId: string): Promise<Department> {
    const department = await this.getDepartmentById(departmentId);

    // Count doctors in department
    const doctorsSnapshot = await collections.doctors
      .where('departmentId', '==', departmentId)
      .count()
      .get();
    const totalDoctors = doctorsSnapshot.data().count;

    // Count patients in department (admitted patients with assigned doctors in this department)
    const patientsSnapshot = await collections.patients
      .where('status', '==', 'admitted')
      .get();

    // Get all doctor IDs in this department
    const departmentDoctors = await collections.doctors
      .where('departmentId', '==', departmentId)
      .get();
    const doctorIds = departmentDoctors.docs.map(doc => doc.id);

    const totalPatients = patientsSnapshot.docs.filter(doc => {
      const patient = doc.data();
      return doctorIds.includes(patient.assignedDoctorId);
    }).length;

    // Count occupied beds
    const bedsSnapshot = await collections.beds
      .where('departmentId', '==', departmentId)
      .where('isOccupied', '==', true)
      .count()
      .get();
    const occupiedBeds = bedsSnapshot.data().count;

    const updatedDepartment: Department = {
      ...department,
      totalDoctors,
      totalPatients,
      occupiedBeds,
      updatedAt: new Date()
    };

    await collections.departments.doc(departmentId).set(updatedDepartment, { merge: true });

    return updatedDepartment;
  }

  /**
   * Get department statistics
   */
  async getDepartmentStats(departmentId: string): Promise<DepartmentStats> {
    const department = await this.getDepartmentById(departmentId);

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

    return {
      departmentId: department.id,
      departmentName: department.name,
      totalDoctors: department.totalDoctors,
      totalPatients: department.totalPatients,
      totalBeds: department.totalBeds,
      occupiedBeds: department.occupiedBeds,
      occupancyPercentage,
      headDoctor
    };
  }

  /**
   * Get all department statistics for a hospital
   */
  async getAllDepartmentStats(hospitalId: string): Promise<DepartmentStats[]> {
    const departments = await this.getDepartmentsByHospital(hospitalId);
    const stats: DepartmentStats[] = [];

    for (const dept of departments) {
      const stat = await this.getDepartmentStats(dept.id);
      stats.push(stat);
    }

    return stats;
  }

  // ===== BED MANAGEMENT =====

  /**
   * Create a bed
   */
  async createBed(data: CreateBedData): Promise<Bed> {
    // Verify department exists
    await this.getDepartmentById(data.departmentId);

    const bedId = generateId();
    const now = new Date();

    const bed: Bed = {
      id: bedId,
      departmentId: data.departmentId,
      hospitalId: data.hospitalId,
      bedNumber: data.bedNumber,
      wardName: data.wardName,
      isOccupied: false,
      createdAt: now,
      updatedAt: now
    };

    await collections.beds.doc(bedId).set(bed);

    return bed;
  }

  /**
   * Get beds by department
   */
  async getBedsByDepartment(departmentId: string): Promise<Bed[]> {
    const snapshot = await collections.beds
      .where('departmentId', '==', departmentId)
      .get();

    return snapshot.docs.map(doc => doc.data() as Bed);
  }

  /**
   * Get available beds in department
   */
  async getAvailableBeds(departmentId: string): Promise<Bed[]> {
    const snapshot = await collections.beds
      .where('departmentId', '==', departmentId)
      .where('isOccupied', '==', false)
      .get();

    return snapshot.docs.map(doc => doc.data() as Bed);
  }

  /**
   * Assign patient to bed
   */
  async assignPatientToBed(bedId: string, patientId: string): Promise<Bed> {
    const bedDoc = await collections.beds.doc(bedId).get();

    if (!bedDoc.exists) {
      throw new NotFoundError('Bed not found');
    }

    const bed = bedDoc.data() as Bed;

    if (bed.isOccupied) {
      throw new ConflictError('Bed is already occupied');
    }

    const now = new Date();
    const updatedBed: Bed = {
      ...bed,
      isOccupied: true,
      patientId,
      admissionDate: now,
      updatedAt: now
    };

    await collections.beds.doc(bedId).set(updatedBed, { merge: true });

    // Update department stats
    await this.updateDepartmentStats(bed.departmentId);

    return updatedBed;
  }

  /**
   * Release bed (discharge patient)
   */
  async releaseBed(bedId: string): Promise<Bed> {
    const bedDoc = await collections.beds.doc(bedId).get();

    if (!bedDoc.exists) {
      throw new NotFoundError('Bed not found');
    }

    const bed = bedDoc.data() as Bed;

    const updatedBed: Bed = {
      ...bed,
      isOccupied: false,
      patientId: undefined,
      admissionDate: undefined,
      updatedAt: new Date()
    };

    await collections.beds.doc(bedId).set(updatedBed, { merge: true });

    // Update department stats
    await this.updateDepartmentStats(bed.departmentId);

    return updatedBed;
  }
}

export const departmentService = new DepartmentService();
