import { Router } from 'express';
import { departmentController } from '../controllers/department.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Department routes
router.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  departmentController.createDepartment.bind(departmentController)
);

router.get(
  '/hospital/:hospitalId',
  departmentController.getDepartmentsByHospital.bind(departmentController)
);

router.get(
  '/hospital/:hospitalId/stats',
  departmentController.getAllDepartmentStats.bind(departmentController)
);

router.get(
  '/:id',
  departmentController.getDepartmentById.bind(departmentController)
);

router.patch(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  departmentController.updateDepartment.bind(departmentController)
);

router.get(
  '/:id/stats',
  departmentController.getDepartmentStats.bind(departmentController)
);

// Bed management routes
router.post(
  '/beds',
  authorize(UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  departmentController.createBed.bind(departmentController)
);

router.get(
  '/:departmentId/beds',
  departmentController.getBedsByDepartment.bind(departmentController)
);

router.get(
  '/:departmentId/beds/available',
  departmentController.getAvailableBeds.bind(departmentController)
);

router.post(
  '/beds/:bedId/assign',
  authorize(UserRole.DOCTOR, UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  departmentController.assignPatientToBed.bind(departmentController)
);

router.post(
  '/beds/:bedId/release',
  authorize(UserRole.DOCTOR, UserRole.ADMIN, UserRole.HOSPITAL_ADMIN),
  departmentController.releaseBed.bind(departmentController)
);

export default router;
