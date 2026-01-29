
import { Injectable, signal, inject } from '@angular/core';
import {
  Firestore,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  orderBy,
  getDocs as getDocsRaw
} from 'firebase/firestore';
import { Payroll } from '../models/payroll.model';
import { ToastService } from './toast.service';
import { AuthService } from '../auth/auth.service';
import { EmployeeService } from './employee.service';
import { AttendanceService } from './attendance.service';
import { RequestsService } from './requests.service';

@Injectable({ providedIn: 'root' })
export class PayrollService {
  private firestore = inject(Firestore);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private employeeService = inject(EmployeeService);
  private attendanceService = inject(AttendanceService);
  private requestsService = inject(RequestsService);

  payroll = signal<Payroll[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Helper: Check if current user is owner
  private isOwner(): boolean {
    return this.authService.isOwner();
  }

  // Helper: Get current user's UID
  private getCurrentUserId(): string | null {
    return this.authService.currentUser()?.uid || null;
  }

  // Helper: Get employee ID for current user
  private async getEmployeeIdForUser(userId: string): Promise<string | null> {
    try {
      const q = query(
        collection(this.firestore, 'employees'),
        where('user_id', '==', userId)
      );
      const snapshot = await getDocsRaw(q);
      if (!snapshot.empty) {
        return snapshot.docs[0].id;
      }
      return null;
    } catch {
      return null;
    }
  }

  // Helper: Check if payroll already exists for employee/month/year
  private async payrollExists(
    employeeId: string,
    month: number,
    year: number
  ): Promise<boolean> {
    try {
      const q = query(
        collection(this.firestore, 'payroll'),
        where('employeeId', '==', employeeId),
        where('month', '==', month),
        where('year', '==', year)
      );
      const snapshot = await getDocsRaw(q);
      return !snapshot.empty;
    } catch {
      return false;
    }
  }

  // Generate payroll for a specific employee for a specific month
  async generatePayrollForEmployee(
    employeeId: string,
    month: number,
    year: number,
    baseSalary: number,
    workingDays: number = 20,
    workingMinutesPerDay: number = 480
  ): Promise<Payroll | null> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Check if payroll already exists for this employee/month/year
      if (await this.payrollExists(employeeId, month, year)) {
        throw new Error(
          `Payroll already exists for employee ${employeeId} in ${month}/${year}`
        );
      }

      // Get attendance data for the month
      const attendanceData = await this.getMonthAttendanceData(employeeId, month, year);

      // Get approved leave data for the month
      const leaveData = await this.getMonthLeaveData(employeeId, month, year);

      // Calculate payable minutes
      const expectedMinutes = workingDays * workingMinutesPerDay;
      const payableMinutes =
        attendanceData.totalMinutesWorked - leaveData.approvedLeaveMinutes;

      // Calculate regular pay amount
      const regularPayAmount = baseSalary * (payableMinutes / expectedMinutes);

      // Create payroll document
      const payrollDoc: Payroll = {
        employeeId,
        month,
        year,
        baseSalary,
        workingDays,
        workingMinutesPerDay,
        attendanceData,
        leaveData,
        calculations: {
          payableMinutes,
          expectedMinutes,
          regularPayAmount
        },
        adjustments: {
          bonuses: [],
          deductions: []
        },
        totalAmount: regularPayAmount,
        status: 'generated'
      };

      // Save to Firestore
      const docRef = await addDoc(collection(this.firestore, 'payroll'), {
        ...payrollDoc,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      this.toastService.success(
        `Payroll generated for employee ${employeeId} for ${month}/${year}`
      );
      return { ...payrollDoc, id: docRef.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate payroll';
      this.error.set(message);
      this.toastService.error(message);
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get all payroll records (with access control)
  async getAllPayroll(): Promise<Payroll[]> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // If owner, get all payroll records
      if (this.isOwner()) {
        const q = query(
          collection(this.firestore, 'payroll'),
          orderBy('year', 'desc'),
          orderBy('month', 'desc')
        );

        const snapshot = await getDocsRaw(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Payroll));

        this.payroll.set(data);
        return data;
      }

      // If employee, get only their own payroll
      const employeeId = await this.getEmployeeIdForUser(userId);
      if (!employeeId) {
        throw new Error('Employee record not found for this user');
      }

      const q = query(
        collection(this.firestore, 'payroll'),
        where('employeeId', '==', employeeId),
        orderBy('year', 'desc'),
        orderBy('month', 'desc')
      );

      const snapshot = await getDocsRaw(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Payroll));

      this.payroll.set(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch payroll';
      this.error.set(message);
      this.toastService.error(message);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get payroll for specific employee (with access control)
  async getEmployeePayroll(employeeId: string): Promise<Payroll[]> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // If not owner, can only view own payroll
      if (!this.isOwner()) {
        const currentEmployeeId = await this.getEmployeeIdForUser(userId);
        if (currentEmployeeId !== employeeId) {
          throw new Error('Access denied: Cannot view other employees payroll');
        }
      }

      const q = query(
        collection(this.firestore, 'payroll'),
        where('employeeId', '==', employeeId),
        orderBy('year', 'desc'),
        orderBy('month', 'desc')
      );

      const snapshot = await getDocsRaw(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Payroll));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch employee payroll';
      this.error.set(message);
      this.toastService.error(message);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get payroll for specific month
  async getMonthPayroll(month: number, year: number): Promise<Payroll[]> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Owner only
      if (!this.isOwner()) {
        throw new Error('Access denied: Only owners can view monthly payroll');
      }

      const q = query(
        collection(this.firestore, 'payroll'),
        where('month', '==', month),
        where('year', '==', year),
        orderBy('employeeId', 'asc')
      );

      const snapshot = await getDocsRaw(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Payroll));

      this.payroll.set(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch monthly payroll';
      this.error.set(message);
      this.toastService.error(message);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  // Helper: Get attendance data for a month
  private async getMonthAttendanceData(
    employeeId: string,
    month: number,
    year: number
  ): Promise<{
    totalMinutesWorked: number;
    totalDaysWorked: number;
    expectedMinutes: number;
  }> {
    try {
      // Get all attendance records for this employee in the month
      const firstDay = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const lastDay = new Date(year, month, 0).toISOString().split('T')[0];

      const q = query(
        collection(this.firestore, 'attendance'),
        where('employee_id', '==', employeeId),
        where('date', '>=', firstDay),
        where('date', '<=', lastDay)
      );

      const snapshot = await getDocsRaw(q);
      const records = snapshot.docs.map(doc => doc.data());

      const totalMinutesWorked = records.reduce(
        (sum, rec) => sum + (rec['total_minutes'] || 0),
        0
      );
      const totalDaysWorked = records.length;
      const expectedMinutes = 0; // Will be set by caller

      return {
        totalMinutesWorked,
        totalDaysWorked,
        expectedMinutes
      };
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      return {
        totalMinutesWorked: 0,
        totalDaysWorked: 0,
        expectedMinutes: 0
      };
    }
  }

  // Helper: Get approved leave data for a month
  private async getMonthLeaveData(
    employeeId: string,
    month: number,
    year: number
  ): Promise<{
    approvedLeaveMinutes: number;
    approvedLeaveDays: number;
  }> {
    try {
      // Get all approved leave requests that overlap with this month
      const q = query(
        collection(this.firestore, 'leave_requests'),
        where('employeeId', '==', employeeId),
        where('status', '==', 'approved')
      );

      const snapshot = await getDocsRaw(q);
      const records = snapshot.docs.map(doc => doc.data());

      let approvedLeaveDays = 0;

      for (const record of records) {
        const startDate = new Date(record['startDate']);
        const endDate = new Date(record['endDate']);

        // Check if leave overlaps with the month
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0);

        if (startDate <= monthEnd && endDate >= monthStart) {
          // Count days in this month
          const countStart = new Date(
            Math.max(startDate.getTime(), monthStart.getTime())
          );
          const countEnd = new Date(Math.min(endDate.getTime(), monthEnd.getTime()));
          const daysInMonth =
            Math.ceil(
              (countEnd.getTime() - countStart.getTime()) / (1000 * 60 * 60 * 24)
            ) + 1;

          approvedLeaveDays += daysInMonth;
        }
      }

      const approvedLeaveMinutes = approvedLeaveDays * 480; // 8 hours = 480 minutes

      return {
        approvedLeaveMinutes,
        approvedLeaveDays
      };
    } catch (err) {
      console.error('Error fetching leave data:', err);
      return {
        approvedLeaveMinutes: 0,
        approvedLeaveDays: 0
      };
    }
  }
}
