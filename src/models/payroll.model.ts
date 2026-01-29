import { EmploymentType } from './employee.model';

export interface PayrollEntry {
  id?: string;
  employeeId: string;
  month: string; // YYYY-MM
  baseSalary: number;
  attendanceHours: number;
  attendancePay: number;
  approvedClaims: number;
  overtimePay?: number;
  deductions?: number;
  netPay: number;
  status: 'draft' | 'finalized';
  generatedAt: Date;
}

export interface PayrollCalculation {
  employeeId: string;
  name: string;
  employmentType: EmploymentType;
  baseSalary: number;
  totalAttendanceHours: number;
  approvedClaims: number;
  netPay: number;
}
