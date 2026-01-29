
import { Injectable } from '@angular/core';
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

  // PHASE 0: STUBBED OUT - Supabase backend has been removed
  // These methods are stubbed to return empty/default responses
  // Will be replaced with Firebase calls in PHASE 1

  // --- Database Setup Check ---

  checkDatabaseSetup(): Observable<DatabaseStatus> {
    console.warn('ApiService.checkDatabaseSetup() is stubbed - Supabase removed, awaiting Firebase implementation');
    return of({ ready: true });
  }

  // --- Authentication ---

  adminLogin(creds: { username: string; password: string }): Observable<AdminLoginResponse> {
    console.warn('ApiService.adminLogin() is stubbed - Supabase removed, awaiting Firebase implementation');
    return of({ success: false, error: 'Backend not yet implemented. Please wait for Firebase migration.' });
  }

  employeeLogin(creds: { email: string; pin: string }): Observable<EmployeeLoginResponse> {
    console.warn('ApiService.employeeLogin() is stubbed - Supabase removed, awaiting Firebase implementation');
    return of({ success: false, error: 'Backend not yet implemented. Please wait for Firebase migration.' });
  }

  async signOut(): Promise<{ error: Error | null }> {
    console.warn('ApiService.signOut() is stubbed - Supabase removed, awaiting Firebase implementation');
    return { error: null };
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
