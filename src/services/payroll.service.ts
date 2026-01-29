

import { Injectable, signal, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { PayrollEntry } from '../models';
import { ToastService } from './toast.service';
import { EmployeeService } from './employee.service';
import { AttendanceService } from './attendance.service';
import { RequestsService } from './requests.service';

export interface PayrollRecord {
  id?: string;
  employeeId: string;
  month: number;
  year: number;
  baseSalary: number;
  attendanceBonus: number;
  deductions: number;
  approvedClaims: number;
  totalPay: number;
  createdAt?: Date;
  status: 'pending' | 'approved' | 'paid';
}

@Injectable({ providedIn: 'root' })
export class PayrollService {
  private firestore = inject(Firestore);
  private toastService = inject(ToastService);
  private employeeService = inject(EmployeeService);
  private attendanceService = inject(AttendanceService);
  private requestsService = inject(RequestsService);

  payrollRecords = signal<PayrollRecord[]>([]);
  isLoading = signal(false);

  // Calculate payroll for an employee
  async calculatePayroll(
    employeeId: string,
    month: number,
    year: number
  ): Promise<PayrollRecord | null> {
    try {
      const employee = await this.employeeService.getEmployeeById(employeeId);

      if (!employee) {
        throw new Error('Employee not found');
      }

      const monthlyHours = await this.attendanceService.getMonthlyHours(employeeId, month, year);
      const requests = await this.requestsService.getEmployeeRequests(employeeId);

      // Calculate approved claims
      const approvedClaims = requests
        .filter(r => r.status === 'approved' && r.type === 'claim')
        .reduce((total, r) => total + (r.amount || 0), 0);

      // Determine salary based on employment type
      let baseSalary = 0;
      let totalPay = 0;

      if (employee.employment_type === 'full_time') {
        baseSalary = employee.monthly_salary_idr || 0;
        totalPay = baseSalary + approvedClaims;
      } else if (employee.employment_type === 'part_time') {
        const hourlyRate = employee.hourly_rate_idr || 0;
        baseSalary = monthlyHours * hourlyRate;
        totalPay = baseSalary + approvedClaims;
      }

      const record: PayrollRecord = {
        employeeId,
        month,
        year,
        baseSalary,
        attendanceBonus: 0,
        deductions: 0,
        approvedClaims,
        totalPay,
        status: 'pending'
      };

      return record;
    } catch (err) {
      console.error('Error calculating payroll:', err);
      return null;
    }
  }

  // Generate payroll for all employees
  async generateMonthlyPayroll(month: number, year: number): Promise<PayrollRecord[]> {
    this.isLoading.set(true);

    try {
      const employees = await this.employeeService.getAllEmployees();
      const payrollRecords: PayrollRecord[] = [];

      for (const employee of employees) {
        const record = await this.calculatePayroll(employee.id, month, year);
        if (record) {
          payrollRecords.push(record);
        }
      }

      // Save records to Firestore
      for (const record of payrollRecords) {
        await addDoc(collection(this.firestore, 'payroll'), {
          ...record,
          createdAt: serverTimestamp()
        });
      }

      this.toastService.success(`Payroll generated for ${payrollRecords.length} employees`);
      return payrollRecords;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate payroll';
      this.toastService.error(message);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get payroll records for employee
  async getEmployeePayroll(employeeId: string): Promise<PayrollRecord[]> {
    this.isLoading.set(true);

    try {
      const q = query(
        collection(this.firestore, 'payroll'),
        where('employeeId', '==', employeeId),
        orderBy('year', 'desc'),
        orderBy('month', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PayrollRecord));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch payroll records';
      this.toastService.error(message);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get payroll for specific month (owner only)
  async getMonthlyPayroll(month: number, year: number): Promise<PayrollRecord[]> {
    this.isLoading.set(true);

    try {
      const q = query(
        collection(this.firestore, 'payroll'),
        where('month', '==', month),
        where('year', '==', year),
        orderBy('employeeId', 'asc')
      );

      const snapshot = await getDocs(q);
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PayrollRecord));

      this.payrollRecords.set(records);
      return records;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch payroll';
      this.toastService.error(message);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }
}
