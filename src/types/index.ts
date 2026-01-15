// ===== ENUMS =====

export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  PHARMACIST = 'pharmacist',
  LAB_TECHNICIAN = 'lab_technician',
  ADMIN = 'admin',
  HOSPITAL_ADMIN = 'hospital_admin'
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

export enum BloodType {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-'
}

export enum VisitStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

export enum ReferralStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  COMPLETED = 'completed'
}

export enum ConsentStatus {
  GRANTED = 'granted',
  REVOKED = 'revoked',
  EXPIRED = 'expired'
}

export enum PrescriptionStatus {
  ACTIVE = 'active',
  DISPENSED = 'dispensed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

export enum LabTestStatus {
  ORDERED = 'ordered',
  SAMPLE_COLLECTED = 'sample_collected',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum DoctorAvailability {
  AVAILABLE = 'available',
  BUSY = 'busy',
  ON_LEAVE = 'on_leave',
  OFFLINE = 'offline'
}

export enum Severity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// ===== INTERFACES =====

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseEntity {
  email: string;
  phoneNumber: string;
  passwordHash: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
}

export interface Patient extends BaseEntity {
  userId: string;
  healthId: string;
  qrCode: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: Gender;
  phoneNumber: string;
  email?: string;
  nin?: string; // National Identification Number (optional)
  address?: Address;
  bloodType?: BloodType;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact?: EmergencyContact;
}

export interface Address {
  street?: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
}

export interface Doctor extends BaseEntity {
  userId: string;
  hospitalId: string;
  firstName: string;
  lastName: string;
  specialization: string;
  department: string;
  licenseNumber: string;
  phoneNumber: string;
  email: string;
  availability: DoctorAvailability;
  maxPatients: number;
  currentPatientCount: number;
}

export interface Hospital extends BaseEntity {
  name: string;
  address: Address;
  phoneNumber: string;
  email: string;
  registrationNumber: string;
  departments: string[];
  isActive: boolean;
}

export interface Pharmacy extends BaseEntity {
  name: string;
  hospitalId?: string; // null if standalone
  address: Address;
  phoneNumber: string;
  licenseNumber: string;
  isActive: boolean;
}

export interface Pharmacist extends BaseEntity {
  userId: string;
  pharmacyId: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  phoneNumber: string;
  email: string;
}

export interface LabCenter extends BaseEntity {
  name: string;
  hospitalId?: string; // null if standalone
  address: Address;
  phoneNumber: string;
  licenseNumber: string;
  servicesOffered: string[];
  isActive: boolean;
}

export interface LabTechnician extends BaseEntity {
  userId: string;
  labCenterId: string;
  firstName: string;
  lastName: string;
  specialization: string;
  licenseNumber: string;
}

// ===== MEDICAL RECORDS =====

export interface MedicalRecord extends BaseEntity {
  patientId: string;
  healthId: string;
}

export interface Visit extends BaseEntity {
  patientId: string;
  doctorId: string;
  hospitalId: string;
  status: VisitStatus;
  chiefComplaint: string;
  symptoms: string[];
  diagnosis?: Diagnosis;
  notes: string;
  vitalSigns?: VitalSigns;
  prescriptions: string[]; // prescription IDs
  labTests: string[]; // lab test IDs
  followUpDate?: Date;
}

export interface Diagnosis {
  code: string; // ICD-10 code
  description: string;
  severity: Severity;
  notes?: string;
}

export interface VitalSigns {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  oxygenSaturation?: number;
  recordedAt: Date;
}

export interface Prescription extends BaseEntity {
  visitId: string;
  patientId: string;
  doctorId: string;
  medications: Medication[];
  status: PrescriptionStatus;
  notes?: string;
  dispensedBy?: string; // pharmacist ID
  dispensedAt?: Date;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface LabTest extends BaseEntity {
  visitId?: string;
  patientId: string;
  orderedBy: string; // doctor ID
  labCenterId?: string;
  testType: string;
  testName: string;
  status: LabTestStatus;
  sampleCollectedAt?: Date;
  results?: LabResult;
  notes?: string;
}

export interface LabResult {
  values: Record<string, string | number>;
  interpretation?: string;
  attachments?: string[]; // URLs
  completedAt: Date;
  verifiedBy: string; // lab technician ID
}

// ===== CONSENT & ACCESS =====

export interface Consent extends BaseEntity {
  patientId: string;
  grantedTo: string; // provider ID (doctor, hospital, pharmacy, lab)
  grantedToType: 'doctor' | 'hospital' | 'pharmacy' | 'lab';
  status: ConsentStatus;
  scope: ConsentScope;
  expiresAt?: Date;
  revokedAt?: Date;
}

export interface ConsentScope {
  viewDiagnosis: boolean;
  viewMedications: boolean;
  viewLabResults: boolean;
  viewAllergies: boolean;
  viewFullHistory: boolean;
}

export interface AccessLog extends BaseEntity {
  patientId: string;
  accessedBy: string;
  accessedByRole: UserRole;
  action: string;
  dataAccessed: string[];
  ipAddress?: string;
  isEmergencyAccess: boolean;
}

// ===== REFERRALS =====

export interface Referral extends BaseEntity {
  patientId: string;
  fromDoctorId: string;
  toDoctorId?: string;
  toHospitalId?: string;
  toDepartment?: string;
  reason: string;
  urgency: Severity;
  status: ReferralStatus;
  notes?: string;
  acceptedAt?: Date;
  completedAt?: Date;
}

// ===== PHARMACY FIRST FLOW =====

export interface PharmacyVisit extends BaseEntity {
  patientId: string;
  pharmacyId: string;
  pharmacistId: string;
  symptoms: string[];
  dispensedMedications: Medication[];
  redFlagsDetected: string[];
  referralRequired: boolean;
  referralId?: string;
  notes?: string;
}

// ===== API RESPONSE TYPES =====

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ===== AUTH TYPES =====

export interface TokenPayload {
  userId: string;
  role: UserRole;
  healthId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface OTPVerification {
  phoneNumber: string;
  otp: string;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
}
