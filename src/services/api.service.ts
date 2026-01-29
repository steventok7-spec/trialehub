
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
    console.warn('ApiService.getEmployees() is stubbed - Supabase removed, awaiting Firebase implementation');
    return of([]);
  }

  addEmployee(data: Partial<Employee>): Observable<{ success: boolean; employee?: Employee; error?: string }> {
    console.warn('ApiService.addEmployee() is stubbed - Supabase removed, awaiting Firebase implementation');
    return of({ success: false, error: 'Backend not yet implemented.' });
  }

  updateEmployee(data: Partial<Employee> & { id: string }): Observable<OperationResponse> {
    console.warn('ApiService.updateEmployee() is stubbed - Supabase removed, awaiting Firebase implementation');
    return of({ success: false, error: 'Backend not yet implemented.' });
  }

  deleteEmployee(id: string): Observable<OperationResponse> {
    console.warn('ApiService.deleteEmployee() is stubbed - Supabase removed, awaiting Firebase implementation');
    return of({ success: false, error: 'Backend not yet implemented.' });
  }

  updateSchedule(data: {
    employeeId: string;
    date: string;
    shift: 'morning' | 'afternoon' | 'full_day';
    startTime?: string;
    endTime?: string;
    notes?: string;
  }): Observable<OperationResponse> {
    console.warn('ApiService.updateSchedule() is stubbed - Supabase removed, awaiting Firebase implementation');
    return of({ success: false, error: 'Backend not yet implemented.' });
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
    console.warn('ApiService.checkIn() is stubbed - Supabase removed, awaiting Firebase implementation');
    return of({ success: false, error: 'Backend not yet implemented.' });
  }

  checkOut(data: { employeeId: string }): Observable<OperationResponse & { hours?: string }> {
    console.warn('ApiService.checkOut() is stubbed - Supabase removed, awaiting Firebase implementation');
    return of({ success: false, error: 'Backend not yet implemented.' });
  }

  getAllAttendance(): Observable<Array<SupabaseAttendance & { employeeName: string; hours: string }>> {
    console.warn('ApiService.getAllAttendance() is stubbed - Supabase removed, awaiting Firebase implementation');
    return of([]);
  }

  getEmployeeHistory(employeeId: string): Observable<EmployeeHistory> {
    console.warn('ApiService.getEmployeeHistory() is stubbed - Supabase removed, awaiting Firebase implementation');
    return of({ attendance: [], summary: { leaveDaysAvailable: 0, sickDaysTaken: 0, pendingClaims: 0 } });
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
