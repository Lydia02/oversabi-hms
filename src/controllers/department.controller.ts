import { Request, Response, NextFunction } from 'express';
import { departmentService } from '../services/department.service.js';
import { getString, getOptionalString } from '../utils/helpers.js';

export class DepartmentController {
  /**
   * Create a new department
   */
  async createDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { hospitalId, name, description, headDoctorId, totalBeds, icon, color } = req.body;

      const department = await departmentService.createDepartment({
        hospitalId,
        name,
        description,
        headDoctorId,
        totalBeds: totalBeds || 0,
        icon,
        color
      });

      res.status(201).json({
        success: true,
        message: 'Department created successfully',
        data: department
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get department by ID
   */
  async getDepartmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departmentId = getString(req.params.id);
      const department = await departmentService.getDepartmentById(departmentId);

      res.json({
        success: true,
        message: 'Department retrieved successfully',
        data: department
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all departments for a hospital
   */
  async getDepartmentsByHospital(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hospitalId = getString(req.params.hospitalId);
      const departments = await departmentService.getDepartmentsByHospital(hospitalId);

      res.json({
        success: true,
        message: 'Departments retrieved successfully',
        data: departments
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update department
   */
  async updateDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departmentId = getString(req.params.id);
      const { name, description, headDoctorId, totalBeds, icon, color, isActive } = req.body;

      const department = await departmentService.updateDepartment(departmentId, {
        name,
        description,
        headDoctorId,
        totalBeds,
        icon,
        color,
        isActive
      });

      res.json({
        success: true,
        message: 'Department updated successfully',
        data: department
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get department statistics
   */
  async getDepartmentStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departmentId = getString(req.params.id);
      const stats = await departmentService.getDepartmentStats(departmentId);

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
   * Get all department statistics for a hospital
   */
  async getAllDepartmentStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hospitalId = getString(req.params.hospitalId);
      const stats = await departmentService.getAllDepartmentStats(hospitalId);

      res.json({
        success: true,
        message: 'Department statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== BED MANAGEMENT =====

  /**
   * Create a bed
   */
  async createBed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { departmentId, hospitalId, bedNumber, wardName } = req.body;

      const bed = await departmentService.createBed({
        departmentId,
        hospitalId,
        bedNumber,
        wardName
      });

      res.status(201).json({
        success: true,
        message: 'Bed created successfully',
        data: bed
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get beds by department
   */
  async getBedsByDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departmentId = getString(req.params.departmentId);
      const beds = await departmentService.getBedsByDepartment(departmentId);

      res.json({
        success: true,
        message: 'Beds retrieved successfully',
        data: beds
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available beds in department
   */
  async getAvailableBeds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departmentId = getString(req.params.departmentId);
      const beds = await departmentService.getAvailableBeds(departmentId);

      res.json({
        success: true,
        message: 'Available beds retrieved successfully',
        data: beds
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign patient to bed
   */
  async assignPatientToBed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bedId = getString(req.params.bedId);
      const { patientId } = req.body;

      const bed = await departmentService.assignPatientToBed(bedId, patientId);

      res.json({
        success: true,
        message: 'Patient assigned to bed successfully',
        data: bed
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Release bed (discharge patient)
   */
  async releaseBed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bedId = getString(req.params.bedId);
      const bed = await departmentService.releaseBed(bedId);

      res.json({
        success: true,
        message: 'Bed released successfully',
        data: bed
      });
    } catch (error) {
      next(error);
    }
  }
}

export const departmentController = new DepartmentController();
