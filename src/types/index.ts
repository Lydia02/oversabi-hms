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

export enum DoctorStatus {
  ON_DUTY = 'on_duty',
  AVAILABLE = 'available',
  OFF_DUTY = 'off_duty'
}

export enum PatientStatus {
  ACTIVE = 'active',
  CRITICAL = 'critical',
  DISCHARGED = 'discharged',
  ADMITTED = 'admitted'
}

export enum Genotype {
  AA = 'AA',
  AS = 'AS',
  SS = 'SS',
  AC = 'AC',
  SC = 'SC',
  CC = 'CC'
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

export enum DocumentType {
  PRESCRIPTION = 'prescription',
  LAB_RESULT = 'lab_result',
  XRAY = 'xray',
  ULTRASOUND = 'ultrasound',
  MRI = 'mri',
  CT_SCAN = 'ct_scan',
  MEDICAL_REPORT = 'medical_report',
  REFERRAL_LETTER = 'referral_letter',
  DISCHARGE_SUMMARY = 'discharge_summary',
  OTHER = 'other'
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
  min: string; // Medical Identification Number
  qrCode: string;
  firstName: string;
  lastName: string;
  otherName?: string;
  dateOfBirth: Date;
  gender: Gender;
  phoneNumber: string;
  email?: string;
  nin?: string; // National Identification Number (optional)
  address?: Address;
  bloodType?: BloodType;
  genotype?: Genotype;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact?: EmergencyContact;
  status: PatientStatus;
  admissionDate?: Date;
  assignedDoctorId?: string;
  weight?: number;
  height?: number;
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
  departmentId?: string;
  licenseNumber: string;
  phoneNumber: string;
  email: string;
  availability: DoctorAvailability;
  status: DoctorStatus;
  experienceYears: number;
  maxPatients: number;
  currentPatientCount: number;
  profileImage?: string;
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

// ===== DEPARTMENTS =====

export interface Department extends BaseEntity {
  hospitalId: string;
  name: string;
  description?: string;
  headDoctorId?: string;
  totalBeds: number;
  occupiedBeds: number;
  totalDoctors: number;
  totalPatients: number;
  icon?: string;
  color?: string;
  isActive: boolean;
}

export interface Bed extends BaseEntity {
  departmentId: string;
  hospitalId: string;
  bedNumber: string;
  wardName?: string;
  isOccupied: boolean;
  patientId?: string;
  admissionDate?: Date;
}

// ===== APPOINTMENTS =====

export interface Appointment extends BaseEntity {
  patientId: string;
  doctorId: string;
  hospitalId: string;
  departmentId?: string;
  scheduledDate: Date;
  scheduledTime: string;
  duration: number; // in minutes
  status: AppointmentStatus;
  type: 'consultation' | 'follow_up' | 'emergency' | 'routine_checkup';
  reason: string;
  notes?: string;
  visitId?: string; // linked visit after appointment is completed
}

// ===== DOCUMENTS =====

export interface Document extends BaseEntity {
  patientId: string;
  uploadedBy: string;
  uploadedByRole: UserRole;
  hospitalId?: string;
  visitId?: string;
  documentType: DocumentType;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  isConfidential: boolean;
}

// ===== CONSULTATION RECORDS =====

export interface ConsultationRecord extends BaseEntity {
  patientId: string;
  doctorId: string;
  hospitalId: string;
  departmentId?: string;
  visitId?: string;
  appointmentId?: string;
  consultationDate: Date;
  symptoms: string[];
  diagnosis?: Diagnosis;
  specialist: string;
  notes?: string;
  followUpRequired: boolean;
  followUpDate?: Date;
}

// ===== DASHBOARD STATISTICS =====

export interface DashboardStats {
  totalPatients: number;
  activeDoctors: number;
  todaysAppointments: number;
  pendingCases: number;
  patientGrowth: number; // percentage
  doctorGrowth: number;
  appointmentGrowth: number;
  caseGrowth: number;
}

export interface DepartmentStats {
  departmentId: string;
  departmentName: string;
  totalDoctors: number;
  totalPatients: number;
  totalBeds: number;
  occupiedBeds: number;
  occupancyPercentage: number;
  headDoctor?: {
    id: string;
    name: string;
  };
}

// ===== MESSAGES/CHAT =====

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read'
}

export interface Message extends BaseEntity {
  conversationId: string;
  senderId: string;
  senderRole: UserRole;
  senderName: string;
  receiverId: string;
  receiverRole: UserRole;
  content: string;
  attachments?: MessageAttachment[];
  status: MessageStatus;
  readAt?: Date;
}

export interface MessageAttachment {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export interface Conversation extends BaseEntity {
  participants: ConversationParticipant[];
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount: Record<string, number>; // userId -> unread count
  isActive: boolean;
}

export interface ConversationParticipant {
  userId: string;
  name: string;
  role: UserRole;
  profileImage?: string;
}

// ===== CALENDAR EVENTS =====

export enum CalendarEventType {
  APPOINTMENT = 'appointment',
  SURGERY = 'surgery',
  MEETING = 'meeting',
  REMINDER = 'reminder',
  FOLLOW_UP = 'follow_up',
  LAB_TEST = 'lab_test',
  OTHER = 'other'
}

export enum CalendarEventStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled'
}

export interface CalendarEvent extends BaseEntity {
  userId: string;
  userRole: UserRole;
  title: string;
  description?: string;
  eventType: CalendarEventType;
  status: CalendarEventStatus;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  allDay: boolean;
  color?: string;
  relatedPatientId?: string;
  relatedDoctorId?: string;
  relatedAppointmentId?: string;
  location?: string;
  reminder?: number; // minutes before event
  isRecurring: boolean;
  recurringPattern?: string; // daily, weekly, monthly
}

// ===== TREATMENT/COMPLAINTS =====

export interface Treatment extends BaseEntity {
  patientId: string;
  doctorId: string;
  hospitalId: string;
  visitId?: string;
  complaint: string;
  symptoms: string[];
  examination: string;
  diagnosis: Diagnosis;
  treatmentPlan: string;
  medications: Medication[];
  procedures?: string[];
  followUpDate?: Date;
  notes?: string;
  status: 'ongoing' | 'completed' | 'discontinued';
}

export interface PatientComplaint extends BaseEntity {
  patientId: string;
  complaint: string;
  description: string;
  severity: Severity;
  onsetDate: Date;
  duration?: string;
  relatedSymptoms: string[];
  previousTreatment?: string;
  attachments?: string[];
  status: 'pending' | 'reviewed' | 'addressed';
  reviewedBy?: string;
  reviewedAt?: Date;
}

// ===== PATIENT STATISTICS =====

export interface PatientStatistics {
  patientId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  date: Date;
  visitCount: number;
  appointmentCount: number;
  prescriptionCount: number;
  labTestCount: number;
  consultationCount: number;
}

export interface DoctorStatistics {
  doctorId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  date: Date;
  patientsSeen: number;
  appointmentsCompleted: number;
  appointmentsCancelled: number;
  prescriptionsWritten: number;
  referralsMade: number;
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
