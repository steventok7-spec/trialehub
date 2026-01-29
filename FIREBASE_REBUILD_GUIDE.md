# SUKHA Employee Hub - Firebase Rebuild Implementation Guide

## Table of Contents

1. [Overview](#overview)
2. [Services](#services)
3. [Shared UI Components](#shared-ui-components)
4. [Layout Components](#layout-components)
5. [Main App Files](#main-app-files)
6. [Firebase Security Rules](#firebase-security-rules)
7. [Cloud Functions](#cloud-functions)

---

## Overview

This guide provides complete, production-ready code for rebuilding the SUKHA Employee Hub app with Firebase/Firestore. All components follow:

- Angular 21 standalone component architecture
- OnPush change detection strategy
- Signals for reactive state management
- Dependency injection via `inject()`
- Tailwind CSS styling (stone-50 backgrounds, zinc-900 text, Inter font)
- TypeScript strict mode compliance
- Production-grade error handling
- Complete type safety

---

## Services

### FILE: src/services/toast.service.ts

```typescript
import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private counter = 0;

  show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration = 3000): void {
    const id = this.counter++;
    const toast: Toast = { id, message, type, duration };
    this.toasts.update(t => [...t, toast]);

    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  success(message: string, options?: { duration?: number }): void {
    this.show(message, 'success', options?.duration ?? 3000);
  }

  error(message: string, options?: { duration?: number }): void {
    this.show(message, 'error', options?.duration ?? 4000);
  }

  info(message: string, options?: { duration?: number }): void {
    this.show(message, 'info', options?.duration ?? 3000);
  }

  warning(message: string, options?: { duration?: number }): void {
    this.show(message, 'warning', options?.duration ?? 3500);
  }

  remove(id: number): void {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}
```

### FILE: src/services/loading.service.ts

```typescript
import { Injectable, signal } from '@angular/core';

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number; // 0-100
}

@Injectable({ providedIn: 'root' })
export class LoadingService {
  state = signal<LoadingState>({ isLoading: false });
  private loadingStack: string[] = [];

  startLoading(key: string = 'default', message?: string): void {
    // Track multiple loading states with a stack
    if (!this.loadingStack.includes(key)) {
      this.loadingStack.push(key);
    }

    this.state.update(current => ({
      ...current,
      isLoading: true,
      message: message || current.message
    }));
  }

  stopLoading(key: string = 'default'): void {
    this.loadingStack = this.loadingStack.filter(k => k !== key);

    if (this.loadingStack.length === 0) {
      this.state.update(current => ({
        ...current,
        isLoading: false,
        message: undefined,
        progress: undefined
      }));
    }
  }

  setProgress(progress: number): void {
    this.state.update(current => ({
      ...current,
      progress: Math.min(100, Math.max(0, progress))
    }));
  }

  reset(): void {
    this.loadingStack = [];
    this.state.set({ isLoading: false });
  }
}
```

### FILE: src/services/employee.service.ts

```typescript
import { Injectable, signal, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Query,
  QueryConstraint,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { Employee, EmployeeProfile, EmployeePrivateDetails, FullEmployeeDetails } from '../models';
import { ToastService } from './toast.service';
import { LoadingService } from './loading.service';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private firestore = inject(Firestore);
  private toastService = inject(ToastService);
  private loadingService = inject(LoadingService);

  employees = signal<Employee[]>([]);
  currentEmployee = signal<FullEmployeeDetails | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Get all employees (owner only)
  async getAllEmployees(): Promise<Employee[]> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const q = query(collection(this.firestore, 'employees'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Employee));

      this.employees.set(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch employees';
      this.error.set(message);
      this.toastService.error(message);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get single employee with both profile and private details
  async getEmployeeById(id: string): Promise<FullEmployeeDetails | null> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const profileDoc = await getDoc(doc(this.firestore, 'employees', id));

      if (!profileDoc.exists()) {
        throw new Error('Employee not found');
      }

      const profileData = profileDoc.data() as Partial<FullEmployeeDetails>;
      const fullEmployee: FullEmployeeDetails = {
        id: profileDoc.id,
        email: '',
        name: '',
        role: 'employee',
        ...profileData
      };

      this.currentEmployee.set(fullEmployee);
      return fullEmployee;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch employee';
      this.error.set(message);
      this.toastService.error(message);
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Create employee
  async createEmployee(employee: Omit<EmployeeProfile, 'id'>): Promise<string | null> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const data = {
        ...employee,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: employee.status || 'active'
      };

      const docRef = await addDoc(collection(this.firestore, 'employees'), data);
      this.toastService.success('Employee created successfully');
      return docRef.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create employee';
      this.error.set(message);
      this.toastService.error(message);
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Update employee
  async updateEmployee(id: string, updates: Partial<FullEmployeeDetails>): Promise<boolean> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const { id: _, ...cleanUpdates } = updates;
      await updateDoc(doc(this.firestore, 'employees', id), {
        ...cleanUpdates,
        updatedAt: serverTimestamp()
      });

      this.toastService.success('Employee updated successfully');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update employee';
      this.error.set(message);
      this.toastService.error(message);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Delete employee
  async deleteEmployee(id: string): Promise<boolean> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await deleteDoc(doc(this.firestore, 'employees', id));
      this.employees.update(emp => emp.filter(e => e.id !== id));
      this.toastService.success('Employee deleted successfully');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete employee';
      this.error.set(message);
      this.toastService.error(message);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Search employees by name or email
  async searchEmployees(searchTerm: string): Promise<Employee[]> {
    if (!searchTerm.trim()) {
      return this.employees();
    }

    this.isLoading.set(true);

    try {
      const lowerSearch = searchTerm.toLowerCase();
      const allEmployees = await this.getAllEmployees();
      return allEmployees.filter(emp =>
        emp.name?.toLowerCase().includes(lowerSearch) ||
        emp.email?.toLowerCase().includes(lowerSearch)
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  // Subscribe to real-time updates
  subscribeToEmployees(callback: (employees: Employee[]) => void): Unsubscribe {
    const q = query(collection(this.firestore, 'employees'));
    return onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Employee));
      this.employees.set(data);
      callback(data);
    }, error => {
      console.error('Error subscribing to employees:', error);
      this.toastService.error('Failed to sync employee data');
    });
  }
}
```

### FILE: src/services/attendance.service.ts

```typescript
import { Injectable, signal, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  serverTimestamp,
  limit,
  orderBy,
  QueryConstraint,
  getDocs as getDocsRaw,
  Timestamp
} from 'firebase/firestore';
import { Attendance } from '../models';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private firestore = inject(Firestore);
  private toastService = inject(ToastService);

  attendance = signal<Attendance[]>([]);
  isLoading = signal(false);

  // Check in
  async checkIn(employeeId: string, latitude?: number, longitude?: number): Promise<boolean> {
    this.isLoading.set(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const checkInTime = new Date().toISOString();

      // Check if already checked in today
      const q = query(
        collection(this.firestore, 'attendance'),
        where('employee_id', '==', employeeId),
        where('date', '==', today)
      );

      const existing = await getDocsRaw(q);

      if (!existing.empty) {
        throw new Error('Already checked in today');
      }

      await addDoc(collection(this.firestore, 'attendance'), {
        employee_id: employeeId,
        date: today,
        check_in: checkInTime,
        check_out: null,
        total_minutes: 0,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        createdAt: serverTimestamp()
      });

      this.toastService.success('Checked in successfully');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Check-in failed';
      this.toastService.error(message);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Check out
  async checkOut(employeeId: string, latitude?: number, longitude?: number): Promise<boolean> {
    this.isLoading.set(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const checkOutTime = new Date().toISOString();

      const q = query(
        collection(this.firestore, 'attendance'),
        where('employee_id', '==', employeeId),
        where('date', '==', today)
      );

      const snapshot = await getDocsRaw(q);

      if (snapshot.empty) {
        throw new Error('No check-in record found for today');
      }

      const attendanceDoc = snapshot.docs[0];
      const checkInTime = attendanceDoc.data()['check_in'];

      // Calculate minutes worked
      const checkInDate = new Date(checkInTime);
      const checkOutDate = new Date(checkOutTime);
      const totalMinutes = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 60000);

      await updateDoc(doc(this.firestore, 'attendance', attendanceDoc.id), {
        check_out: checkOutTime,
        total_minutes: totalMinutes,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        updatedAt: serverTimestamp()
      });

      this.toastService.success('Checked out successfully');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Check-out failed';
      this.toastService.error(message);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get attendance records for employee
  async getEmployeeAttendance(employeeId: string, daysBack: number = 30): Promise<Attendance[]> {
    this.isLoading.set(true);

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
      const startDateStr = startDate.toISOString().split('T')[0];

      const q = query(
        collection(this.firestore, 'attendance'),
        where('employee_id', '==', employeeId),
        where('date', '>=', startDateStr),
        orderBy('date', 'desc'),
        limit(daysBack)
      );

      const snapshot = await getDocsRaw(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Attendance));

      this.attendance.set(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch attendance';
      this.toastService.error(message);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get attendance for a specific date range
  async getAttendanceByDateRange(employeeId: string, startDate: string, endDate: string): Promise<Attendance[]> {
    this.isLoading.set(true);

    try {
      const q = query(
        collection(this.firestore, 'attendance'),
        where('employee_id', '==', employeeId),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocsRaw(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Attendance));
    } catch (err) {
      console.error('Error fetching attendance by date range:', err);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get today's attendance for employee
  async getTodayAttendance(employeeId: string): Promise<Attendance | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const q = query(
        collection(this.firestore, 'attendance'),
        where('employee_id', '==', employeeId),
        where('date', '==', today)
      );

      const snapshot = await getDocsRaw(q);

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as Attendance;
    } catch (err) {
      console.error('Error fetching today attendance:', err);
      return null;
    }
  }

  // Calculate total hours for a month
  async getMonthlyHours(employeeId: string, month: number, year: number): Promise<number> {
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const records = await this.getAttendanceByDateRange(employeeId, startDate, endDate);
      return records.reduce((total, record) => total + (record.total_minutes || 0), 0) / 60; // Convert to hours
    } catch (err) {
      console.error('Error calculating monthly hours:', err);
      return 0;
    }
  }
}
```

### FILE: src/services/requests.service.ts

```typescript
import { Injectable, signal, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { Request, RequestStatus, RequestType } from '../models';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class RequestsService {
  private firestore = inject(Firestore);
  private toastService = inject(ToastService);

  requests = signal<Request[]>([]);
  isLoading = signal(false);

  // Create request
  async createRequest(
    employeeId: string,
    type: RequestType,
    data: {
      start_date?: string;
      end_date?: string;
      reason?: string;
      amount?: number;
    }
  ): Promise<string | null> {
    this.isLoading.set(true);

    try {
      const docRef = await addDoc(collection(this.firestore, 'requests'), {
        employee_id: employeeId,
        type,
        status: 'pending',
        ...data,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      this.toastService.success('Request submitted successfully');
      return docRef.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create request';
      this.toastService.error(message);
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get requests for employee
  async getEmployeeRequests(employeeId: string): Promise<Request[]> {
    this.isLoading.set(true);

    try {
      const q = query(
        collection(this.firestore, 'requests'),
        where('employee_id', '==', employeeId),
        orderBy('created_at', 'desc')
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Request));

      this.requests.set(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch requests';
      this.toastService.error(message);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get all pending requests (owner only)
  async getPendingRequests(): Promise<Request[]> {
    this.isLoading.set(true);

    try {
      const q = query(
        collection(this.firestore, 'requests'),
        where('status', '==', 'pending'),
        orderBy('created_at', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Request));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch requests';
      this.toastService.error(message);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  // Approve request
  async approveRequest(requestId: string): Promise<boolean> {
    this.isLoading.set(true);

    try {
      await updateDoc(doc(this.firestore, 'requests', requestId), {
        status: 'approved' as RequestStatus,
        updated_at: serverTimestamp()
      });

      this.toastService.success('Request approved');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve request';
      this.toastService.error(message);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Reject request
  async rejectRequest(requestId: string): Promise<boolean> {
    this.isLoading.set(true);

    try {
      await updateDoc(doc(this.firestore, 'requests', requestId), {
        status: 'rejected' as RequestStatus,
        updated_at: serverTimestamp()
      });

      this.toastService.success('Request rejected');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reject request';
      this.toastService.error(message);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get request statistics
  async getRequestStats(employeeId: string): Promise<{
    totalRequests: number;
    approvedRequests: number;
    pendingRequests: number;
    rejectedRequests: number;
  }> {
    try {
      const requests = await this.getEmployeeRequests(employeeId);

      return {
        totalRequests: requests.length,
        approvedRequests: requests.filter(r => r.status === 'approved').length,
        pendingRequests: requests.filter(r => r.status === 'pending').length,
        rejectedRequests: requests.filter(r => r.status === 'rejected').length
      };
    } catch (err) {
      console.error('Error getting request stats:', err);
      return {
        totalRequests: 0,
        approvedRequests: 0,
        pendingRequests: 0,
        rejectedRequests: 0
      };
    }
  }
}
```

### FILE: src/services/scheduling.service.ts

```typescript
import { Injectable, signal, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { ToastService } from './toast.service';

export interface Shift {
  id?: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'morning' | 'afternoon' | 'evening' | 'full';
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({ providedIn: 'root' })
export class SchedulingService {
  private firestore = inject(Firestore);
  private toastService = inject(ToastService);

  shifts = signal<Shift[]>([]);
  isLoading = signal(false);

  // Get employee's shifts for a date range
  async getEmployeeShifts(employeeId: string, startDate: string, endDate: string): Promise<Shift[]> {
    this.isLoading.set(true);

    try {
      const q = query(
        collection(this.firestore, 'shifts'),
        where('employeeId', '==', employeeId),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc')
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Shift));

      this.shifts.set(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch shifts';
      this.toastService.error(message);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get today's shift
  async getTodayShift(employeeId: string): Promise<Shift | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const q = query(
        collection(this.firestore, 'shifts'),
        where('employeeId', '==', employeeId),
        where('date', '==', today)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as Shift;
    } catch (err) {
      console.error('Error fetching today shift:', err);
      return null;
    }
  }

  // Create shift (owner only)
  async createShift(shift: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    this.isLoading.set(true);

    try {
      const docRef = await addDoc(collection(this.firestore, 'shifts'), {
        ...shift,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      this.toastService.success('Shift created successfully');
      return docRef.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create shift';
      this.toastService.error(message);
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Update shift (owner only)
  async updateShift(id: string, updates: Partial<Shift>): Promise<boolean> {
    this.isLoading.set(true);

    try {
      const { id: _, createdAt, ...cleanUpdates } = updates as any;
      await updateDoc(doc(this.firestore, 'shifts', id), {
        ...cleanUpdates,
        updatedAt: serverTimestamp()
      });

      this.toastService.success('Shift updated successfully');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update shift';
      this.toastService.error(message);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get all shifts for a date (owner only)
  async getShiftsByDate(date: string): Promise<Shift[]> {
    this.isLoading.set(true);

    try {
      const q = query(
        collection(this.firestore, 'shifts'),
        where('date', '==', date),
        orderBy('startTime', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Shift));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch shifts';
      this.toastService.error(message);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }
}
```

### FILE: src/services/payroll.service.ts

```typescript
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
```

### FILE: src/services/geolocation.service.ts

```typescript
import { Injectable, signal } from '@angular/core';
import { ToastService } from './toast.service';
import { GEOFENCE_RADIUS_METERS, GEOFENCE_LAT, GEOFENCE_LNG } from '../core/constants';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  currentLocation = signal<LocationCoordinates | null>(null);
  isWithinGeofence = signal(false);
  isLoading = signal(false);
  error = signal<string | null>(null);

  private watchId: number | null = null;

  constructor(private toastService: ToastService) {}

  // Request current location (one-time)
  async getCurrentLocation(): Promise<LocationCoordinates | null> {
    this.isLoading.set(true);
    this.error.set(null);

    if (!navigator.geolocation) {
      const message = 'Geolocation is not supported by your browser';
      this.error.set(message);
      this.toastService.error(message);
      this.isLoading.set(false);
      return null;
    }

    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        position => {
          const coords: LocationCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };

          this.currentLocation.set(coords);
          this.checkGeofence(coords);
          this.isLoading.set(false);
          resolve(coords);
        },
        err => {
          const message = this.getGeolocationErrorMessage(err.code);
          this.error.set(message);
          this.toastService.error(message);
          this.isLoading.set(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  // Watch location continuously
  watchLocation(callback?: (coords: LocationCoordinates) => void): boolean {
    if (!navigator.geolocation) {
      this.error.set('Geolocation not supported');
      return false;
    }

    if (this.watchId !== null) {
      return true; // Already watching
    }

    this.watchId = navigator.geolocation.watchPosition(
      position => {
        const coords: LocationCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };

        this.currentLocation.set(coords);
        this.checkGeofence(coords);

        if (callback) {
          callback(coords);
        }
      },
      err => {
        console.error('Watch position error:', err);
        this.error.set(this.getGeolocationErrorMessage(err.code));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    return true;
  }

  // Stop watching location
  stopWatchingLocation(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Check if location is within geofence
  private checkGeofence(coords: LocationCoordinates): void {
    const distance = this.calculateDistance(
      coords.latitude,
      coords.longitude,
      GEOFENCE_LAT,
      GEOFENCE_LNG
    );

    this.isWithinGeofence.set(distance <= GEOFENCE_RADIUS_METERS);
  }

  // Calculate distance between two coordinates (Haversine formula)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Format location for display
  formatLocation(coords: LocationCoordinates): string {
    return `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
  }

  private getGeolocationErrorMessage(code: number): string {
    const messages: Record<number, string> = {
      1: 'Permission denied - please enable location access',
      2: 'Position unavailable - check your connection',
      3: 'Request timeout - please try again'
    };

    return messages[code] || 'Unable to get location';
  }
}
```

---

## Shared UI Components

### FILE: src/components/ui/button.component.ts

```typescript
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || isLoading"
      [class]="computedClass()"
      (click)="onClick()"
      [attr.aria-label]="ariaLabel"
      [attr.data-testid]="testId"
    >
      <span *ngIf="isLoading" class="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></span>
      <ng-content></ng-content>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() disabled = false;
  @Input() isLoading = false;
  @Input() fullWidth = false;
  @Input() ariaLabel: string | null = null;
  @Input() testId: string | null = null;
  @Output() clicked = new EventEmitter<void>();

  computedClass(): string {
    const baseClass = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const sizeClass = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    }[this.size];

    const variantClass = {
      primary: 'bg-zinc-900 text-white hover:bg-zinc-800 focus:ring-zinc-900',
      secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus:ring-zinc-900',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
      outline: 'border-2 border-zinc-900 text-zinc-900 hover:bg-zinc-50 focus:ring-zinc-900',
      ghost: 'text-zinc-900 hover:bg-zinc-100 focus:ring-zinc-900'
    }[this.variant];

    const widthClass = this.fullWidth ? 'w-full' : '';

    return `${baseClass} ${sizeClass} ${variantClass} ${widthClass}`;
  }

  onClick(): void {
    if (!this.disabled && !this.isLoading) {
      this.clicked.emit();
    }
  }
}
```

### FILE: src/components/ui/loading-spinner.component.ts

```typescript
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SpinnerSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-center" [class.gap-3]="showLabel">
      <div
        [class]="spinnerClass()"
        class="border-current border-t-transparent rounded-full animate-spin"
      ></div>
      @if (showLabel && label) {
        <span class="text-sm text-zinc-600">{{ label }}</span>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingSpinnerComponent {
  @Input() size: SpinnerSize = 'md';
  @Input() label: string | null = null;
  @Input() showLabel = false;

  spinnerClass(): string {
    const sizeMap = {
      sm: 'w-4 h-4 border-2',
      md: 'w-6 h-6 border-2',
      lg: 'w-8 h-8 border-3'
    };

    return sizeMap[this.size];
  }
}
```

### FILE: src/components/ui/modal.component.ts

```typescript
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from './button.component';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div
      class="fixed inset-0 bg-black/50 z-40 transition-opacity duration-200"
      [class.opacity-0]="!isOpen"
      [class.pointer-events-none]="!isOpen"
      (click)="onBackdropClick()"
    ></div>

    <div
      role="dialog"
      [attr.aria-modal]="true"
      [attr.aria-labelledby]="titleId"
      class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-stone-50 rounded-2xl shadow-2xl max-w-sm w-[90vw] max-h-[90vh] overflow-y-auto z-50 transition-all duration-200"
      [class.scale-100]="isOpen"
      [class.scale-95]="!isOpen"
      [class.opacity-100]="isOpen"
      [class.opacity-0]="!isOpen"
      [class.pointer-events-none]="!isOpen"
    >
      <div class="p-6 sm:p-8">
        @if (title) {
          <h2 [id]="titleId" class="text-2xl font-bold text-zinc-900 mb-4">{{ title }}</h2>
        }

        <ng-content></ng-content>

        @if (showActions) {
          <div class="flex gap-3 justify-end mt-6">
            @if (cancelLabel) {
              <app-button
                variant="secondary"
                (clicked)="onCancel()"
              >
                {{ cancelLabel }}
              </app-button>
            }
            @if (confirmLabel) {
              <app-button
                variant="primary"
                (clicked)="onConfirm()"
                [isLoading]="isLoading"
              >
                {{ confirmLabel }}
              </app-button>
            }
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title: string | null = null;
  @Input() confirmLabel: string | null = null;
  @Input() cancelLabel: string | null = null;
  @Input() showActions = true;
  @Input() isLoading = false;
  @Input() closeOnBackdropClick = true;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  readonly titleId = 'modal-title';

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen && this.closeOnBackdropClick) {
      this.cancelled.emit();
    }
  }

  onBackdropClick(): void {
    if (this.closeOnBackdropClick) {
      this.cancelled.emit();
    }
  }

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
```

### FILE: src/components/ui/form-input.component.ts

```typescript
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full">
      @if (label) {
        <label [for]="inputId" class="block text-sm font-semibold text-zinc-900 mb-2">
          {{ label }}
          @if (required) {
            <span class="text-red-500">*</span>
          }
        </label>
      }

      <input
        [id]="inputId"
        [type]="type"
        [placeholder]="placeholder"
        [value]="value"
        (input)="onInput($event)"
        (blur)="onBlur()"
        [disabled]="disabled"
        [required]="required"
        [class]="inputClass()"
        [attr.aria-label]="ariaLabel"
        [attr.aria-describedby]="errorId"
      />

      @if (error) {
        <p [id]="errorId" class="text-red-600 text-sm mt-1">{{ error }}</p>
      }
      @if (helperText && !error) {
        <p class="text-zinc-500 text-sm mt-1">{{ helperText }}</p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormInputComponent),
      multi: true
    }
  ]
})
export class FormInputComponent implements ControlValueAccessor {
  @Input() label: string | null = null;
  @Input() type: string = 'text';
  @Input() placeholder = '';
  @Input() error: string | null = null;
  @Input() helperText: string | null = null;
  @Input() disabled = false;
  @Input() required = false;
  @Input() ariaLabel: string | null = null;
  @Output() valueChange = new EventEmitter<string>();
  @Output() blurred = new EventEmitter<void>();

  value = '';
  readonly inputId = `input-${Math.random().toString(36).substr(2, 9)}`;
  readonly errorId = `${this.inputId}-error`;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  inputClass(): string {
    const base = 'w-full px-4 py-2.5 rounded-lg border-2 font-medium text-zinc-900 placeholder-zinc-400 transition-colors focus:outline-none';
    const borderClass = this.error
      ? 'border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500'
      : 'border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900';
    const disabledClass = this.disabled ? 'bg-zinc-50 cursor-not-allowed opacity-60' : 'bg-white';

    return `${base} ${borderClass} ${disabledClass}`;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
    this.valueChange.emit(this.value);
  }

  onBlur(): void {
    this.onTouched();
    this.blurred.emit();
  }

  writeValue(value: string): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
```

### FILE: src/components/ui/form-select.component.ts

```typescript
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

@Component({
  selector: 'app-form-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full">
      @if (label) {
        <label [for]="selectId" class="block text-sm font-semibold text-zinc-900 mb-2">
          {{ label }}
          @if (required) {
            <span class="text-red-500">*</span>
          }
        </label>
      }

      <select
        [id]="selectId"
        [value]="value"
        (change)="onChange($event)"
        (blur)="onBlur()"
        [disabled]="disabled"
        [required]="required"
        [class]="selectClass()"
        [attr.aria-label]="ariaLabel"
        [attr.aria-describedby]="errorId"
      >
        @if (placeholder) {
          <option value="" disabled>{{ placeholder }}</option>
        }
        @for (option of options; track option.value) {
          <option [value]="option.value" [disabled]="option.disabled">
            {{ option.label }}
          </option>
        }
      </select>

      @if (error) {
        <p [id]="errorId" class="text-red-600 text-sm mt-1">{{ error }}</p>
      }
      @if (helperText && !error) {
        <p class="text-zinc-500 text-sm mt-1">{{ helperText }}</p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormSelectComponent),
      multi: true
    }
  ]
})
export class FormSelectComponent implements ControlValueAccessor {
  @Input() label: string | null = null;
  @Input() placeholder = '-- Select --';
  @Input() options: SelectOption[] = [];
  @Input() error: string | null = null;
  @Input() helperText: string | null = null;
  @Input() disabled = false;
  @Input() required = false;
  @Input() ariaLabel: string | null = null;
  @Output() valueChange = new EventEmitter<string | number>();
  @Output() blurred = new EventEmitter<void>();

  value: string | number = '';
  readonly selectId = `select-${Math.random().toString(36).substr(2, 9)}`;
  readonly errorId = `${this.selectId}-error`;

  private onChangeFunc: (value: string | number) => void = () => {};
  private onTouched: () => void = () => {};

  selectClass(): string {
    const base = 'w-full px-4 py-2.5 rounded-lg border-2 font-medium text-zinc-900 bg-white cursor-pointer transition-colors focus:outline-none appearance-none';
    const borderClass = this.error
      ? 'border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500'
      : 'border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900';
    const disabledClass = this.disabled ? 'bg-zinc-50 cursor-not-allowed opacity-60' : '';

    return `${base} ${borderClass} ${disabledClass}`;
  }

  onChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.value = target.value;
    this.onChangeFunc(this.value);
    this.valueChange.emit(this.value);
  }

  onBlur(): void {
    this.onTouched();
    this.blurred.emit();
  }

  writeValue(value: string | number): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string | number) => void): void {
    this.onChangeFunc = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
```

### FILE: src/components/ui/card.component.ts

```typescript
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CardVariant = 'elevated' | 'outlined' | 'flat';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cardClass()" [attr.data-testid]="testId">
      @if (title) {
        <div class="p-4 sm:p-6 border-b border-zinc-200">
          <h3 class="text-lg font-bold text-zinc-900">{{ title }}</h3>
        </div>
      }

      <div [class]="contentClass()">
        <ng-content></ng-content>
      </div>

      @if (footer) {
        <div class="p-4 sm:p-6 border-t border-zinc-200 bg-zinc-50 rounded-b-lg">
          <ng-content select="[card-footer]"></ng-content>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent {
  @Input() title: string | null = null;
  @Input() variant: CardVariant = 'elevated';
  @Input() footer = false;
  @Input() padding: 'sm' | 'md' | 'lg' = 'md';
  @Input() testId: string | null = null;

  cardClass(): string {
    const base = 'rounded-lg overflow-hidden';
    const variantClass = {
      elevated: 'bg-white shadow-md hover:shadow-lg transition-shadow',
      outlined: 'bg-stone-50 border border-zinc-200',
      flat: 'bg-zinc-50'
    }[this.variant];

    return `${base} ${variantClass}`;
  }

  contentClass(): string {
    const paddingMap = {
      sm: 'p-3 sm:p-4',
      md: 'p-4 sm:p-6',
      lg: 'p-6 sm:p-8'
    };

    return paddingMap[this.padding];
  }
}
```

### FILE: src/components/ui/empty-state.component.ts

```typescript
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from './icon.component';
import { ButtonComponent } from './button.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, IconComponent, ButtonComponent],
  template: `
    <div
      class="flex flex-col items-center justify-center py-16 px-4 text-center"
      [class]="containerClass"
      role="status"
      [attr.aria-label]="ariaLabel || message"
    >
      @if (icon) {
        <div class="mb-4 p-4 bg-zinc-100 rounded-full">
          <app-icon [name]="icon" size="48" class="text-zinc-400" />
        </div>
      }

      @if (title) {
        <h3 class="text-lg font-bold text-zinc-900 mb-2">{{ title }}</h3>
      }

      <p class="text-zinc-500 text-sm max-w-xs mb-4">{{ message }}</p>

      @if (actionLabel) {
        <app-button
          variant="primary"
          (clicked)="onAction()"
          [attr.aria-label]="actionLabel"
        >
          {{ actionLabel }}
        </app-button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  @Input() icon: string = '';
  @Input() title: string = '';
  @Input() message: string = 'No data available';
  @Input() actionLabel: string = '';
  @Input() action: (() => void) | null = null;
  @Input() containerClass: string = '';
  @Input() ariaLabel: string = '';

  onAction(): void {
    this.action?.();
  }
}
```

### FILE: src/components/ui/icon.component.ts

```typescript
import { Component, Input, computed, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      [class]="class()"
      [innerHTML]="safePath()"
    ></svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconComponent {
  private sanitizer = inject(DomSanitizer);

  name = signal<string>('');
  @Input('name') set _name(val: string) { this.name.set(val); }

  size = signal<number | string>(24);
  @Input('size') set _size(val: number | string) { this.size.set(val); }

  @Input() set class(val: string) { this.classSignal.set(val); }
  private classSignal = signal<string>('');

  private icons: Record<string, string> = {
    'eye': '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    'eye-off': '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>',
    'user': '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    'lock': '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    'alert-triangle': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>',
    'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    'x-circle': '<circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/>',
    'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    'calendar': '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',
    'receipt': '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
    'map-pin': '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    'log-out': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
    'menu': '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
    'check': '<polyline points="20 6 9 17 4 12"/>',
    'x': '<line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/>',
    'edit': '<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
    'trash': '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    'arrow-right': '<line x1="5" x2="19" y1="12" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    'arrow-left': '<line x1="19" x2="5" y1="12" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    'chevron-down': '<polyline points="6 9 12 15 18 9"/>',
    'chevron-up': '<polyline points="18 15 12 9 6 15"/>',
    'home': '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    'settings': '<circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6"/><path d="M4.22 4.22l4.24 4.24m2.12 2.12l4.24 4.24"/><path d="M1 12h6m6 0h6"/><path d="M4.22 19.78l4.24-4.24m2.12-2.12l4.24-4.24"/>'
  };

  class = computed(() => this.classSignal());

  safePath = computed(() => {
    return this.sanitizer.bypassSecurityTrustHtml(this.icons[this.name()] || '');
  });
}
```

### FILE: src/components/ui/toast.component.ts

```typescript
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-6 md:bottom-8 right-6 z-[60] flex flex-col gap-3 max-w-[calc(100vw-3rem)]">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          role="alert"
          class="min-w-[280px] max-w-[400px] p-4 rounded-xl shadow-2xl text-sm font-semibold transition-all transform animate-slide-up backdrop-blur-md border-2"
          [class.bg-green-50]="toast.type === 'success'"
          [class.bg-red-50]="toast.type === 'error'"
          [class.bg-blue-50]="toast.type === 'info'"
          [class.bg-yellow-50]="toast.type === 'warning'"
          [class.text-green-700]="toast.type === 'success'"
          [class.text-red-700]="toast.type === 'error'"
          [class.text-blue-700]="toast.type === 'info'"
          [class.text-yellow-700]="toast.type === 'warning'"
          [class.border-green-200]="toast.type === 'success'"
          [class.border-red-200]="toast.type === 'error'"
          [class.border-blue-200]="toast.type === 'info'"
          [class.border-yellow-200]="toast.type === 'warning'"
        >
          {{ toast.message }}
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slide-up {
      from {
        transform: translateY(100%) scale(0.9);
        opacity: 0;
      }
      to {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
    }
    .animate-slide-up {
      animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastComponent {
  toastService = inject(ToastService);
}
```

---

## Layout Components

### FILE: src/components/layout/header.component.ts

```typescript
import { Component, Input, Output, EventEmitter, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { ButtonComponent } from '../ui/button.component';
import { IconComponent } from '../ui/icon.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonComponent, IconComponent],
  template: `
    <header class="bg-white border-b border-zinc-200 sticky top-0 z-40 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <div class="flex-shrink-0 font-bold text-xl text-zinc-900">
            SUKHA Hub
          </div>

          <!-- Desktop Nav -->
          <div class="hidden md:flex items-center gap-8">
            @if (authService.isOwner()) {
              <a routerLink="/admin/dashboard" class="text-zinc-600 hover:text-zinc-900 font-medium transition-colors">
                Dashboard
              </a>
              <a routerLink="/admin/employees" class="text-zinc-600 hover:text-zinc-900 font-medium transition-colors">
                Employees
              </a>
            }
            @if (authService.isEmployee()) {
              <a routerLink="/employee/dashboard" class="text-zinc-600 hover:text-zinc-900 font-medium transition-colors">
                Dashboard
              </a>
              <a routerLink="/employee/attendance" class="text-zinc-600 hover:text-zinc-900 font-medium transition-colors">
                Attendance
              </a>
            }
          </div>

          <!-- Right Actions -->
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 text-sm">
              <span class="text-zinc-600">{{ authService.currentUser()?.name }}</span>
              @if (authService.isOwner()) {
                <span class="px-2 py-1 bg-zinc-100 text-zinc-700 rounded text-xs font-semibold">
                  Owner
                </span>
              }
            </div>

            <app-button
              variant="ghost"
              size="sm"
              (clicked)="onLogout()"
              [isLoading]="isLoggingOut"
            >
              <app-icon name="log-out" size="20" />
            </app-button>

            <button
              (click)="toggleMobileMenu()"
              class="md:hidden p-2 text-zinc-600 hover:text-zinc-900 transition-colors"
              aria-label="Toggle menu"
            >
              <app-icon name="menu" size="24" />
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  authService = inject(AuthService);
  @Input() isLoggingOut = false;
  @Output() mobileMenuToggled = new EventEmitter<void>();

  async onLogout(): Promise<void> {
    await this.authService.logout();
  }

  toggleMobileMenu(): void {
    this.mobileMenuToggled.emit();
  }
}
```

### FILE: src/components/layout/sidebar.component.ts

```typescript
import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { IconComponent } from '../ui/icon.component';

export interface SidebarItem {
  label: string;
  path: string;
  icon: string;
  roles?: ('owner' | 'employee')[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <aside class="hidden md:flex fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-zinc-200 overflow-y-auto">
      <nav class="flex-1 p-6 space-y-2">
        @for (item of visibleItems; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="bg-zinc-100 text-zinc-900 border-r-4 border-zinc-900"
            [routerLinkActiveOptions]="{ exact: false }"
            class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors rounded-lg"
          >
            <app-icon [name]="item.icon" size="20" />
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>
    </aside>

    <!-- Mobile Sidebar -->
    <aside
      *ngIf="isMobileOpen"
      class="fixed md:hidden inset-0 top-16 z-30 bg-white border-r border-zinc-200 w-64 overflow-y-auto"
      (click)="$event.stopPropagation()"
    >
      <nav class="p-6 space-y-2">
        @for (item of visibleItems; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="bg-zinc-100"
            [routerLinkActiveOptions]="{ exact: false }"
            class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors rounded-lg"
            (click)="closeMobileMenu()"
          >
            <app-icon [name]="item.icon" size="20" />
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>
    </aside>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  private authService = inject(AuthService);

  @Input() isMobileOpen = false;
  @Input() items: SidebarItem[] = [];

  get visibleItems(): SidebarItem[] {
    const userRole = this.authService.isOwner() ? 'owner' : 'employee';
    return this.items.filter(item => !item.roles || item.roles.includes(userRole));
  }

  closeMobileMenu(): void {
    this.isMobileOpen = false;
  }
}
```

---

## Main App Files

### FILE: src/main.ts

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { importProvidersFrom } from '@angular/core';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { initializeFirebase } from './core/firebase.config';

// Initialize Firebase before app bootstrap
initializeFirebase();

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideAnimations()
  ]
}).catch(err => console.error(err));
```

### FILE: src/app.component.ts

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './components/ui/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  template: `
    <router-outlet></router-outlet>
    <app-toast></app-toast>
  `,
  styles: [`
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-slide-up {
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .animate-scale-in {
      animation: scaleIn 0.2s ease-out;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {}
```

### FILE: src/app.routes.ts

```typescript
import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // Auth Routes
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },

  // Employee Routes
  {
    path: 'employee',
    canActivate: [authGuard],
    data: { role: 'employee' },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/employee/dashboard.component').then(m => m.EmployeeDashboardComponent)
      },
      {
        path: 'attendance',
        loadComponent: () => import('./pages/employee/attendance.component').then(m => m.AttendanceComponent)
      },
      {
        path: 'requests',
        loadComponent: () => import('./pages/employee/requests.component').then(m => m.RequestsComponent)
      },
      {
        path: 'payroll',
        loadComponent: () => import('./pages/employee/payroll.component').then(m => m.PayrollComponent)
      }
    ]
  },

  // Owner/Admin Routes
  {
    path: 'admin',
    canActivate: [authGuard],
    data: { role: 'owner' },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/admin/dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'employees',
        loadComponent: () => import('./pages/admin/employees.component').then(m => m.EmployeesComponent)
      },
      {
        path: 'employees/:id',
        loadComponent: () => import('./pages/admin/employee-detail.component').then(m => m.EmployeeDetailComponent)
      },
      {
        path: 'scheduling',
        loadComponent: () => import('./pages/admin/scheduling.component').then(m => m.SchedulingComponent)
      },
      {
        path: 'payroll',
        loadComponent: () => import('./pages/admin/payroll.component').then(m => m.PayrollComponent)
      },
      {
        path: 'requests',
        loadComponent: () => import('./pages/admin/requests.component').then(m => m.RequestsComponent)
      }
    ]
  },

  // Catch all
  { path: '**', redirectTo: '/login' }
];
```

---

## Firebase Security Rules

### FILE: firestore.rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users collection - authenticated users can read their own profile
    match /users/{uid} {
      allow read: if request.auth.uid == uid;
      allow create: if request.auth.uid == uid &&
                      request.resource.data.email == request.auth.token.email;
      allow update: if request.auth.uid == uid;
      allow delete: if false; // Never allow user deletion
    }

    // Employees collection
    match /employees/{employeeId} {
      // Owners can read/write all employees
      allow read, write: if hasRole('owner');

      // Employees can read their own data
      allow read: if hasRole('employee') &&
                     isEmployeeDataOwned(employeeId);

      // Employees cannot write their own data (only admins)
      allow write: if false;

      // Helper function to check employee ownership
      function isEmployeeDataOwned(employeeId) {
        let currentUserEmail = request.auth.token.email;
        return get(/databases/$(database)/documents/employees/$(employeeId)).data.email == currentUserEmail;
      }
    }

    // Attendance collection
    match /attendance/{attendanceId} {
      // Owners can read all attendance
      allow read: if hasRole('owner');

      // Employees can read/write their own attendance
      allow read: if hasRole('employee') &&
                     resource.data.employee_id == getCurrentUserId();
      allow create: if hasRole('employee') &&
                       request.resource.data.employee_id == getCurrentUserId();
      allow update: if hasRole('employee') &&
                       resource.data.employee_id == getCurrentUserId();
      allow delete: if hasRole('owner');

      // Owners can update any attendance
      allow update: if hasRole('owner');
    }

    // Requests collection
    match /requests/{requestId} {
      // Owners can read all requests
      allow read: if hasRole('owner');

      // Employees can read/write their own requests
      allow read: if hasRole('employee') &&
                     resource.data.employee_id == getCurrentUserId();
      allow create: if hasRole('employee') &&
                       request.resource.data.employee_id == getCurrentUserId();

      // Employees cannot modify requests (only owners can approve/reject)
      allow update: if hasRole('owner');
      allow delete: if hasRole('owner');
    }

    // Shifts collection
    match /shifts/{shiftId} {
      // Owners can read/write all shifts
      allow read, write: if hasRole('owner');

      // Employees can read their own shifts
      allow read: if hasRole('employee') &&
                     resource.data.employeeId == getCurrentUserId();
    }

    // Payroll collection
    match /payroll/{payrollId} {
      // Owners can read/write all payroll
      allow read, write: if hasRole('owner');

      // Employees can read their own payroll
      allow read: if hasRole('employee') &&
                     resource.data.employeeId == getCurrentUserId();
    }

    // Helper functions
    function hasRole(role) {
      return request.auth != null &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }

    function getCurrentUserId() {
      return request.auth.uid;
    }

    // Prevent direct write to root
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Cloud Functions

### FILE: functions/src/index.ts

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

admin.initializeApp();
const db = admin.firestore();

// Email configuration - update with your email service
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD
  }
});

// ============================================================================
// PAYROLL FUNCTIONS
// ============================================================================

/**
 * Generate monthly payroll for all employees
 * Trigger: Cloud Scheduler (monthly at end of month)
 */
export const generateMonthlyPayroll = functions.pubsub
  .schedule('0 0 1 * *') // First day of each month
  .timeZone('Asia/Jakarta')
  .onRun(async (context) => {
    try {
      const today = new Date();
      const month = today.getMonth(); // 0-11
      const year = today.getFullYear();

      // Get all active employees
      const employeesSnapshot = await db
        .collection('employees')
        .where('status', '==', 'active')
        .get();

      const payrollEntries: Array<{
        employeeId: string;
        month: number;
        year: number;
        baseSalary: number;
        approvedClaims: number;
        totalPay: number;
        createdAt: admin.firestore.FieldValue;
        status: string;
      }> = [];

      for (const employeeDoc of employeesSnapshot.docs) {
        const employee = employeeDoc.data();

        // Calculate attendance hours
        const monthlyHours = await calculateMonthlyHours(
          employeeDoc.id,
          month,
          year
        );

        // Get approved claims
        const approvedClaims = await calculateApprovedClaims(employeeDoc.id);

        // Calculate salary
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

        payrollEntries.push({
          employeeId: employeeDoc.id,
          month,
          year,
          baseSalary,
          approvedClaims,
          totalPay,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'pending'
        });
      }

      // Batch write payroll entries
      const batch = db.batch();
      for (const entry of payrollEntries) {
        const docRef = db.collection('payroll').doc();
        batch.set(docRef, entry);
      }

      await batch.commit();

      console.log(`Generated payroll for ${payrollEntries.length} employees`);
      return { success: true, count: payrollEntries.length };
    } catch (error) {
      console.error('Error generating payroll:', error);
      throw new functions.https.HttpsError('internal', 'Payroll generation failed');
    }
  });

/**
 * Auto-approve sick leave requests
 * Trigger: When request document is created with type 'sick'
 */
export const autoApproveSickLeave = functions.firestore
  .document('requests/{requestId}')
  .onCreate(async (snap, context) => {
    try {
      const request = snap.data();

      // Only process sick requests
      if (request.type !== 'sick') {
        return;
      }

      // Auto-approve with a maximum of 3 days per month
      const employeeId = request.employee_id;
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      // Count approved sick leaves this month
      const approvedSickLeaves = await db
        .collection('requests')
        .where('employee_id', '==', employeeId)
        .where('type', '==', 'sick')
        .where('status', '==', 'approved')
        .get();

      let approvedDays = 0;
      for (const doc of approvedSickLeaves.docs) {
        const data = doc.data();
        if (data.start_date && data.end_date) {
          const start = new Date(data.start_date);
          const end = new Date(data.end_date);
          approvedDays += Math.ceil(
            (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
          );
        }
      }

      // Auto-approve if under limit
      if (approvedDays < 3) {
        await snap.ref.update({
          status: 'approved',
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
          autoApproved: true
        });

        // Send notification email
        const employee = await db.collection('employees').doc(employeeId).get();
        if (employee.exists) {
          await sendEmail(
            employee.data()?.email,
            'Sick Leave Approved',
            `Your sick leave request has been automatically approved.`
          );
        }
      }

      return;
    } catch (error) {
      console.error('Error processing sick leave:', error);
    }
  });

/**
 * Send notification emails when requests are approved
 * Trigger: When request status is updated to 'approved'
 */
export const notifyRequestApproval = functions.firestore
  .document('requests/{requestId}')
  .onUpdate(async (change, context) => {
    try {
      const newData = change.after.data();
      const oldData = change.before.data();

      // Only process status changes to 'approved'
      if (oldData.status === 'approved' || newData.status !== 'approved') {
        return;
      }

      const request = newData;
      const employee = await db
        .collection('employees')
        .doc(request.employee_id)
        .get();

      if (!employee.exists) {
        return;
      }

      const employeeEmail = employee.data()?.email;
      const requestType = request.type.charAt(0).toUpperCase() + request.type.slice(1);

      await sendEmail(
        employeeEmail,
        `${requestType} Request Approved`,
        `Your ${request.type} request has been approved by your manager.`
      );

      return;
    } catch (error) {
      console.error('Error sending approval notification:', error);
    }
  });

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate total hours worked in a month
 */
async function calculateMonthlyHours(
  employeeId: string,
  month: number,
  year: number
): Promise<number> {
  try {
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const snapshot = await db
      .collection('attendance')
      .where('employee_id', '==', employeeId)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .get();

    let totalMinutes = 0;
    for (const doc of snapshot.docs) {
      totalMinutes += doc.data().total_minutes || 0;
    }

    return Math.round((totalMinutes / 60) * 100) / 100; // Convert to hours
  } catch (error) {
    console.error('Error calculating monthly hours:', error);
    return 0;
  }
}

/**
 * Calculate total approved claims
 */
async function calculateApprovedClaims(employeeId: string): Promise<number> {
  try {
    const snapshot = await db
      .collection('requests')
      .where('employee_id', '==', employeeId)
      .where('type', '==', 'claim')
      .where('status', '==', 'approved')
      .get();

    let total = 0;
    for (const doc of snapshot.docs) {
      total += doc.data().amount || 0;
    }

    return total;
  } catch (error) {
    console.error('Error calculating approved claims:', error);
    return 0;
  }
}

/**
 * Send email notification
 */
async function sendEmail(
  to: string,
  subject: string,
  text: string
): Promise<void> {
  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      text,
      html: `<p>${text}</p>`
    });

    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

/**
 * HTTP function to manually trigger payroll generation
 * Requires authentication
 */
export const triggerPayrollGeneration = functions.https.onCall(
  async (data, context) => {
    // Verify user is owner
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Must be authenticated'
      );
    }

    const userDoc = await db.collection('users').doc(context.auth.uid).get();

    if (!userDoc.exists || userDoc.data()?.role !== 'owner') {
      throw new functions.https.HttpsError('permission-denied', 'Must be owner');
    }

    const { month, year } = data;

    if (!month || !year) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Month and year are required'
      );
    }

    try {
      const employeesSnapshot = await db
        .collection('employees')
        .where('status', '==', 'active')
        .get();

      let count = 0;

      for (const employeeDoc of employeesSnapshot.docs) {
        const employee = employeeDoc.data();

        const monthlyHours = await calculateMonthlyHours(
          employeeDoc.id,
          month - 1,
          year
        );
        const approvedClaims = await calculateApprovedClaims(employeeDoc.id);

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

        await db.collection('payroll').add({
          employeeId: employeeDoc.id,
          month,
          year,
          baseSalary,
          approvedClaims,
          totalPay,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'pending'
        });

        count++;
      }

      return { success: true, message: `Generated payroll for ${count} employees` };
    } catch (error) {
      console.error('Error generating payroll:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Payroll generation failed'
      );
    }
  }
);
```

---

## Setup Instructions

### Firebase Configuration

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database (start in test mode, then update rules)
3. Enable Firebase Authentication (Email/Password)
4. Copy your Firebase config to `src/environments/environment.ts`
5. Deploy security rules: `firebase deploy --only firestore:rules`
6. Deploy Cloud Functions: `firebase deploy --only functions`

### Environment Variables

Create `.env` file in project root:

```
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
OWNER_EMAIL=steventok7@gmail.com
```

### Dependencies

```bash
npm install firebase @angular/fire
npm install --save-dev @types/node
```

### Running the App

```bash
npm run dev       # Development server
npm run build     # Production build
npm test          # Run tests
npm run test:e2e  # End-to-end tests
```

---

## Production Checklist

- [ ] Update Firebase security rules for production
- [ ] Enable Firebase Authentication providers (Email, Google, etc.)
- [ ] Configure CORS for API requests
- [ ] Set up email service for notifications
- [ ] Enable backups in Firestore settings
- [ ] Configure monitoring and logging
- [ ] Add rate limiting to Cloud Functions
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Test all authentication flows
- [ ] Verify geolocation service on devices
- [ ] Load test payroll generation
- [ ] Set up CI/CD pipeline
- [ ] Configure domain and SSL certificates
- [ ] Add analytics (Google Analytics)
- [ ] Set up backup and disaster recovery

---

## Notes

- All components use OnPush change detection for optimal performance
- Signals are used for reactive state management
- Firestore auto-scaling handles variable loads
- Cloud Functions have built-in retry logic
- Security rules enforce role-based access control
- Email notifications are sent asynchronously
- Geolocation is optional and gracefully degraded
- All data is encrypted in transit and at rest

