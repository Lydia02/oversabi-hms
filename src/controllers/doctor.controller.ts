import { Request, Response, NextFunction } from 'express';
import { doctorService, CreateDoctorData, UpdateDoctorData } from '../services/doctor.service.js';
import { DoctorAvailability, Severity } from '../types/index.js';
import { getString, getOptionalString } from '../utils/helpers.js';

/**
 * @swagger
 * /doctors:
 *   post:
 *     summary: Create a new doctor profile
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hospitalId
 *               - firstName
 *               - lastName
 *               - specialization
 *               - department
 *               - licenseNumber
 *               - phoneNumber
 *               - email
 *             properties:
 *               hospitalId:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               specialization:
 *                 type: string
 *               department:
 *                 type: string
 *               licenseNumber:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               email:
 *                 type: string
 *               maxPatients:
 *                 type: integer
 *                 default: 20
 *     responses:
 *       201:
 *         description: Doctor profile created
 */
export async function createDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const data: CreateDoctorData = {
      userId,
      ...req.body
    };

    const doctor = await doctorService.createDoctor(data);

    res.status(201).json({
      success: true,
      message: 'Doctor profile created successfully',
      data: doctor
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /doctors/me:
 *   get:
 *     summary: Get current doctor's profile
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Doctor profile retrieved
 */
export async function getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    const doctor = await doctorService.getDoctorByUserId(userId);

    res.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /doctors/{id}:
 *   get:
 *     summary: Get doctor by ID
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor retrieved
 */
export async function getDoctorById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getString(req.params.id);

    const doctor = await doctorService.getDoctorById(id);

    res.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /doctors/{id}:
 *   patch:
 *     summary: Update doctor information
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               specialization:
 *                 type: string
 *               department:
 *                 type: string
 *               availability:
 *                 type: string
 *                 enum: [available, busy, on_leave, offline]
 *               maxPatients:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Doctor updated
 */
export async function updateDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getString(req.params.id);
    const data: UpdateDoctorData = req.body;

    const doctor = await doctorService.updateDoctor(id, data);

    res.json({
      success: true,
      message: 'Doctor updated successfully',
      data: doctor
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /doctors/{id}/availability:
 *   patch:
 *     summary: Set doctor availability
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - availability
 *             properties:
 *               availability:
 *                 type: string
 *                 enum: [available, busy, on_leave, offline]
 *     responses:
 *       200:
 *         description: Availability updated
 */
export async function setAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getString(req.params.id);
    const { availability } = req.body;

    const doctor = await doctorService.setAvailability(id, availability as DoctorAvailability);

    res.json({
      success: true,
      message: 'Availability updated',
      data: doctor
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /doctors/hospital/{hospitalId}:
 *   get:
 *     summary: Get all doctors in a hospital
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hospitalId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Doctors retrieved
 */
export async function getDoctorsByHospital(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const hospitalId = getString(req.params.hospitalId);
    const { page, limit } = req.query;

    const result = await doctorService.getDoctorsByHospital(
      hospitalId,
      parseInt(getString(page)) || 1,
      parseInt(getString(limit)) || 10
    );

    res.json({
      success: true,
      data: result.doctors,
      total: result.total
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /doctors/hospital/{hospitalId}/available:
 *   get:
 *     summary: Get available doctors in a hospital
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hospitalId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Available doctors retrieved
 */
export async function getAvailableDoctors(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const hospitalId = getString(req.params.hospitalId);
    const department = getOptionalString(req.query.department);

    const doctors = await doctorService.getAvailableDoctors(hospitalId, department);

    res.json({
      success: true,
      data: doctors,
      count: doctors.length
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /doctors/{id}/patients:
 *   get:
 *     summary: Get patients assigned to a doctor
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Patients retrieved with doctor info
 */
export async function getDoctorPatients(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getString(req.params.id);
    const { page, limit } = req.query;

    const result = await doctorService.getDoctorPatients(
      id,
      parseInt(getString(page)) || 1,
      parseInt(getString(limit)) || 10
    );

    res.json({
      success: true,
      data: {
        doctor: {
          id: result.doctor.id,
          name: `${result.doctor.firstName} ${result.doctor.lastName}`,
          specialization: result.doctor.specialization,
          department: result.doctor.department,
          currentPatientCount: result.doctor.currentPatientCount,
          maxPatients: result.doctor.maxPatients,
          availability: result.doctor.availability
        },
        patients: result.patients,
        total: result.total
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /doctors/{id}/stats:
 *   get:
 *     summary: Get doctor workload statistics
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Statistics retrieved
 */
export async function getDoctorStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = getString(req.params.id);

    const stats = await doctorService.getDoctorStats(id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /doctors/{id}/refer:
 *   post:
 *     summary: Refer a patient to another doctor/department
 *     tags: [Doctors, Referrals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID (referring doctor)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - reason
 *               - urgency
 *             properties:
 *               patientId:
 *                 type: string
 *               toDoctorId:
 *                 type: string
 *               toHospitalId:
 *                 type: string
 *               toDepartment:
 *                 type: string
 *               reason:
 *                 type: string
 *               urgency:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Referral created
 */
export async function referPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const fromDoctorId = getString(req.params.id);
    const { patientId, toDoctorId, toHospitalId, toDepartment, reason, urgency, notes } = req.body;

    const referral = await doctorService.referPatient(fromDoctorId, patientId, {
      toDoctorId,
      toHospitalId,
      toDepartment,
      reason,
      urgency: urgency as Severity,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Referral created successfully',
      data: referral
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /doctors/{id}/referrals/accept/{referralId}:
 *   post:
 *     summary: Accept a referral
 *     tags: [Doctors, Referrals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID (accepting doctor)
 *       - in: path
 *         name: referralId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Referral accepted
 */
export async function acceptReferral(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const doctorId = getString(req.params.id);
    const referralId = getString(req.params.referralId);

    const referral = await doctorService.acceptReferral(doctorId, referralId);

    res.json({
      success: true,
      message: 'Referral accepted',
      data: referral
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /doctors/referrals/pending:
 *   get:
 *     summary: Get pending referrals for hospital/department
 *     tags: [Doctors, Referrals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: hospitalId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pending referrals retrieved
 */
export async function getPendingReferrals(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const hospitalId = getString(req.query.hospitalId);
    const department = getOptionalString(req.query.department);
    const doctorId = getOptionalString(req.query.doctorId);

    const referrals = await doctorService.getPendingReferrals(
      hospitalId,
      department,
      doctorId
    );

    res.json({
      success: true,
      data: referrals,
      count: referrals.length
    });
  } catch (error) {
    next(error);
  }
}
