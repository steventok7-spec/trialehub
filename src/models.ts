
export type JobTitle = 'commis_kitchen' | 'barista' | 'steward' | 'commis_pastry' | 'fnb_service' | 'manager';
export type EmploymentType = 'full_time' | 'part_time';
export type EmployeeStatus = 'active' | 'inactive';
export type BankName = 'bca' | 'mandiri' | 'bni' | 'bri' | 'cimb' | 'permata' | 'danamon' | 'other';
export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type RequestType = 'leave' | 'sick' | 'claim';

export interface EmployeeProfile {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'employee' | string;
  job_title?: JobTitle | string;
  employment_type?: EmploymentType | string;
  status?: EmployeeStatus | string;
  gender?: 'male' | 'female' | 'other';
  date_of_birth?: string; // YYYY-MM-DD
  phone_number?: string;
  start_date?: string; // YYYY-MM-DD
}

export interface EmployeePrivateDetails {
  id: string; // matches profile id
  bank_name?: BankName;
  bank_account_number?: string;
  monthly_salary_idr?: number;
  hourly_rate_idr?: number;

  // Enhanced Fields
  address?: string;
  national_id?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  probation_end_date?: string;
}

// Combined interface for Admin views
export interface FullEmployeeDetails extends EmployeeProfile, EmployeePrivateDetails { }

export interface Attendance {
  id?: string;
  employee_id: string;
  date: string;
  check_in: string | null; // ISO string
  check_out: string | null; // ISO string
  total_minutes: number;
  hours?: string | number;
}

export interface Request {
  id?: string;
  employee_id: string;
  type: RequestType;
  status: RequestStatus;
  start_date?: string;
  end_date?: string; // used for sick/leave date or sick date
  reason?: string;
  amount?: number; // for claims
  created_at?: string;
  // Joins
  profiles?: { name: string };
}

export interface PayrollEntry {
  employeeId: string;
  name: string;
  employmentType: EmploymentType;
  baseSalary: number;
  totalAttendanceHours: number; // for part time calc
  approvedClaims: number;
  netPay: number;
}

// Additional Interfaces for Component Support
export interface EmployeeSummary {
  leaveDaysAvailable: number;
  sickDaysTaken: number;
  pendingClaims: number;
}

export interface EmployeeHistory {
  attendance: Attendance[];
  summary: EmployeeSummary;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'employee' | string;
  salary?: number;
  schedule?: Record<string, boolean>;
  job_title?: string;
  employment_type?: string;
  status?: string;
  [key: string]: unknown;
}

export interface Owner {
  username: string;
  name: string;
  role: 'owner' | string;
  [key: string]: unknown;
}

// Legacy alias for backward compatibility
export type Admin = Owner;
