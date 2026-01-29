
import { Injectable, inject } from '@angular/core';
import { from, Observable, of, map, switchMap, catchError, throwError } from 'rxjs';
import {
  EmployeeProfile,
  FullEmployeeDetails,
  Attendance,
  Request,
  PayrollEntry,
  Employee,
  Admin,
  EmployeeHistory
} from '../models';
import { AuthService, AuthUser } from '../auth/auth.service';
import { EmployeeService } from './employee.service';
import { AttendanceService } from './attendance.service';
import { SchedulingService } from './scheduling.service';

/** Response type for database status check */
interface DatabaseStatus {
  ready: boolean;
  errors?: string[];
}

/** Response type for admin login */
interface AdminLoginResponse {
  success: boolean;
  admin?: Admin;
  error?: string;
}

/** Response type for employee login */
interface EmployeeLoginResponse {
  success: boolean;
  employee?: Employee;
  error?: string;
}

/** Response type for admin summary */
interface AdminSummary {
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
}

/** Response type for operations */
interface OperationResponse {
  success: boolean;
  error?: string;
}

/** Profile data from Supabase */
interface SupabaseProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  job_title?: string;
  employment_type?: string;
  status?: string;
  private_details?: {
    monthly_salary_idr?: number;
    hourly_rate_idr?: number;
  };
}

/** Attendance record from Supabase */
interface SupabaseAttendance {
  id: string;
  employee_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  total_minutes: number | null;
  profiles?: { name: string };
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private authService = inject(AuthService);
  private employeeService = inject(EmployeeService);
  private attendanceService = inject(AttendanceService);
  private schedulingService = inject(SchedulingService);

  // --- Database Setup Check ---

  checkDatabaseSetup(): Observable<DatabaseStatus> {
    // Firebase doesn't require setup like Supabase - it's always ready
    return of({ ready: true });
  }

  // --- Authentication ---

  adminLogin(creds: { username: string; password: string }): Observable<AdminLoginResponse> {
    // Username is treated as email for Firebase Auth
    const email = creds.username?.trim().toLowerCase() || '';
    const password = creds.password || '';

    if (!email || !password) {
      return of({ success: false, error: 'Email and password are required.' });
    }

    return from(this.authService.login(email, password)).pipe(
      switchMap((user: AuthUser) => {
        // Check if user is owner
        if (user.role !== 'owner') {
          return of({ success: false, error: 'Access denied: Not an owner account.' });
        }

        return of({
          success: true,
          admin: {
            username: user.email,
            name: user.name,
            role: user.role
          }
        });
      }),
      catchError((err) => {
        const errorMessage = err?.message || 'Login failed. Please try again.';
        console.error('Admin login failed:', err);
        return of({ success: false, error: errorMessage });
      })
    );
  }

  employeeLogin(creds: { email: string; pin: string }): Observable<EmployeeLoginResponse> {
    const email = creds.email?.trim().toLowerCase() || '';
    const password = creds.pin || '';

    if (!email || !password) {
      return of({ success: false, error: 'Email and PIN are required.' });
    }

    return from(this.authService.login(email, password)).pipe(
      switchMap((user: AuthUser) => {
        // Employees can be owner or employee role
        // (employees created after first owner signup)
        return of({
          success: true,
          employee: {
            id: user.uid,
            name: user.name,
            email: user.email,
            role: user.role,
            status: 'active'
          }
        });
      }),
      catchError((err) => {
        const errorMessage = err?.message || 'Login failed. Please try again.';
        console.error('Employee login failed:', err);
        return of({ success: false, error: errorMessage });
      })
    );
  }

  async signOut(): Promise<{ error: Error | null }> {
    try {
      await this.authService.logout();
      return { error: null };
    } catch (err) {
      console.error('Sign out failed:', err);
      return { error: err instanceof Error ? err : new Error('Sign out failed') };
    }
  }

  // --- Admin Dashboard Data ---

  getAdminSummary(): Observable<AdminSummary> {
    console.warn('ApiService.getAdminSummary() is stubbed - Supabase removed, awaiting Firebase implementation');
    return of({ totalEmployees: 0, presentToday: 0, onLeave: 0 });
  }

  // --- Employee Management (Admin) ---

  getEmployees(): Observable<Employee[]> {
    return from(this.employeeService.getAllEmployees()).pipe(
      catchError((err) => {
        console.error('Failed to fetch employees:', err);
        return of([]);
      })
    );
  }

  addEmployee(data: Partial<Employee>): Observable<{ success: boolean; employee?: Employee; error?: string }> {
    // Validate required fields
    if (!data.name?.trim() || !data.email?.trim()) {
      return of({ success: false, error: 'Name and email are required.' });
    }

    return from((async () => {
      try {
        const employeeProfile: Partial<EmployeeProfile> = {
          email: data.email,
          name: data.name,
          role: 'employee',
          job_title: data.job_title,
          employment_type: data.employment_type,
          status: data.status || 'active',
          phone_number: data['phone_number'],
          date_of_birth: data['date_of_birth'],
          gender: data['gender'],
          start_date: data['start_date']
        };

        const employeeId = await this.employeeService.createEmployee(employeeProfile);

        if (!employeeId) {
          return {
            success: false,
            error: this.employeeService.error() || 'Failed to create employee.'
          };
        }

        return {
          success: true,
          employee: {
            ...data,
            id: employeeId,
            role: 'employee',
            status: 'active'
          } as Employee
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create employee.';
        console.error('Add employee failed:', err);
        return { success: false, error: errorMessage };
      }
    })());
  }

  updateEmployee(data: Partial<Employee> & { id: string }): Observable<OperationResponse> {
    // Validate required ID
    if (!data.id) {
      return of({ success: false, error: 'Employee ID is required.' });
    }

    return from((async () => {
      try {
        const updates: Partial<FullEmployeeDetails> = {
          name: data.name,
          email: data.email,
          job_title: data.job_title,
          employment_type: data.employment_type,
          status: data.status,
          phone_number: data['phone_number'],
          date_of_birth: data['date_of_birth'],
          gender: data['gender'],
          start_date: data['start_date']
        };

        const success = await this.employeeService.updateEmployee(data.id, updates);
        return { success, error: success ? undefined : this.employeeService.error() || 'Failed to update employee.' };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update employee.';
        console.error('Update employee failed:', err);
        return { success: false, error: errorMessage };
      }
    })());
  }

  deleteEmployee(id: string): Observable<OperationResponse> {
    if (!id) {
      return of({ success: false, error: 'Employee ID is required.' });
    }

    return from(this.employeeService.deactivateEmployee(id)).pipe(
      map((success) => ({
        success,
        error: success ? undefined : this.employeeService.error() || 'Failed to deactivate employee.'
      })),
      catchError((err) => {
        const errorMessage = err instanceof Error ? err.message : 'Failed to deactivate employee.';
        console.error('Delete employee failed:', err);
        return of({ success: false, error: errorMessage });
      })
    );
  }

  updateSchedule(data: {
    employeeId: string;
    date: string;
    shift: 'morning' | 'afternoon' | 'full_day';
    startTime?: string;
    endTime?: string;
    notes?: string;
  }): Observable<OperationResponse> {
    if (!data.employeeId || !data.date || !data.shift) {
      return of({ success: false, error: 'Employee ID, date, and shift are required.' });
    }

    return from((async () => {
      try {
        const shiftId = await this.schedulingService.createShift({
          employeeId: data.employeeId,
          date: data.date,
          startTime: data.startTime || '09:00',
          endTime: data.endTime || '17:00',
          type: this.mapShiftType(data.shift)
        });

        if (!shiftId) {
          return {
            success: false,
            error: this.schedulingService.error() || 'Failed to create schedule.'
          };
        }

        return { success: true };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update schedule.';
        console.error('Update schedule failed:', err);
        return { success: false, error: errorMessage };
      }
    })());
  }

  private mapShiftType(shift: 'morning' | 'afternoon' | 'full_day'): 'morning' | 'afternoon' | 'evening' | 'full' {
    const mapping = {
      'morning': 'morning' as const,
      'afternoon': 'afternoon' as const,
      'full_day': 'full' as const
    };
    return mapping[shift] || 'full';
  }

  getEmployeeDetails(id: string): Observable<{
    details: FullEmployeeDetails | null;
    attendance: Array<Attendance & { hours: string }>;
    leave: Array<{ from: string; to: string; reason: string; status: string }>;
    claims: Array<{ date: string; amount: number; description: string; status: string }>;
  }> {
    console.warn('ApiService.getEmployeeDetails() is stubbed - Supabase removed, awaiting Firebase implementation');
    return of({ details: null, attendance: [], leave: [], claims: [] });
  }

  getFullEmployeeDetails(id: string): Observable<FullEmployeeDetails | null> {
    console.warn('ApiService.getFullEmployeeDetails() is stubbed - Supabase removed, awaiting Firebase implementation');
    return of(null);
  }

  // --- Attendance ---

  checkIn(data: { employeeId: string; latitude: number; longitude: number }): Observable<OperationResponse> {
    if (!data.employeeId) {
      return of({ success: false, error: 'Employee ID is required.' });
    }

    return from(this.attendanceService.checkIn(data.employeeId, data.latitude, data.longitude)).pipe(
      map((success) => ({
        success,
        error: success ? undefined : this.attendanceService.error() || 'Check-in failed.'
      })),
      catchError((err) => {
        const errorMessage = err instanceof Error ? err.message : 'Check-in failed.';
        console.error('Check-in failed:', err);
        return of({ success: false, error: errorMessage });
      })
    );
  }

  checkOut(data: { employeeId: string }): Observable<OperationResponse & { hours?: string }> {
    if (!data.employeeId) {
      return of({ success: false, error: 'Employee ID is required.' });
    }

    return from(this.attendanceService.checkOut(data.employeeId)).pipe(
      map((success) => ({
        success,
        error: success ? undefined : this.attendanceService.error() || 'Check-out failed.'
      })),
      catchError((err) => {
        const errorMessage = err instanceof Error ? err.message : 'Check-out failed.';
        console.error('Check-out failed:', err);
        return of({ success: false, error: errorMessage });
      })
    );
  }

  getAllAttendance(): Observable<Array<SupabaseAttendance & { employeeName: string; hours: string }>> {
    return from(this.attendanceService.getAllAttendance()).pipe(
      switchMap(async (records) => {
        // Enhance with employee names
        const enhanced = await Promise.all(
          records.map(async (record) => {
            const empId = record.employee_id;
            try {
              const emp = await this.employeeService.getEmployeeById(empId);
              return {
                ...record,
                employeeName: emp?.name || 'Unknown',
                hours: record.total_minutes ? (record.total_minutes / 60).toFixed(1) : '-'
              };
            } catch {
              return {
                ...record,
                employeeName: 'Unknown',
                hours: record.total_minutes ? (record.total_minutes / 60).toFixed(1) : '-'
              };
            }
          })
        );
        return enhanced;
      }),
      catchError((err) => {
        console.error('Failed to fetch attendance:', err);
        return of([]);
      })
    );
  }

  getEmployeeHistory(employeeId: string): Observable<EmployeeHistory> {
    if (!employeeId) {
      return of({ attendance: [], summary: { leaveDaysAvailable: 0, sickDaysTaken: 0, pendingClaims: 0 } });
    }

    return from(this.attendanceService.getEmployeeAttendance(employeeId)).pipe(
      map((records) => ({
        attendance: records.map(r => ({
          ...r,
          hours: r.total_minutes ? (r.total_minutes / 60).toFixed(1) : '-'
        })),
        summary: {
          leaveDaysAvailable: 12, // Placeholder
          sickDaysTaken: 0,        // Placeholder
          pendingClaims: 0         // Placeholder
        }
      })),
      catchError((err) => {
        console.error('Failed to fetch employee history:', err);
        return of({ attendance: [], summary: { leaveDaysAvailable: 0, sickDaysTaken: 0, pendingClaims: 0 } });
      })
    );
  }

  // --- Requests ---

  submitLeaveRequest(data: { employeeId: string; fromDate: string; toDate: string; reason: string }): Observable<OperationResponse> {
    console.warn('ApiService.submitLeaveRequest() is stubbed - Supabase removed, awaiting Firebase implementation');
    return of({ success: false, error: 'Backend not yet implemented.' });
  }

  submitSickReport(data: { employeeId: string; date: string; notes?: string }): Observable<OperationResponse> {
    console.warn('ApiService.submitSickReport() is stubbed - Supabase removed, awaiting Firebase implementation');
    return of({ success: false, error: 'Backend not yet implemented.' });
  }

  submitExpenseClaim(data: { employeeId: string; amount: number; description: string; date?: string }): Observable<OperationResponse> {
    console.warn('ApiService.submitExpenseClaim() is stubbed - Supabase removed, awaiting Firebase implementation');
    return of({ success: false, error: 'Backend not yet implemented.' });
  }

  getRequests(type?: 'leave' | 'sick' | 'claim'): Observable<Request[]> {
    console.warn('ApiService.getRequests() is stubbed - Supabase removed, awaiting Firebase implementation');
    return of([]);
  }

  updateRequestStatus(requestId: string, status: 'approved' | 'rejected'): Observable<OperationResponse> {
    console.warn('ApiService.updateRequestStatus() is stubbed - Supabase removed, awaiting Firebase implementation');
    return of({ success: false, error: 'Backend not yet implemented.' });
  }

  // --- Payroll ---

  async generatePayroll(year: number, month: number): Promise<PayrollEntry[]> {
    console.warn('ApiService.generatePayroll() is stubbed - Supabase removed, awaiting Firebase implementation');
    return [];
  }
}
