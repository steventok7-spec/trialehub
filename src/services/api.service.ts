
import { Injectable } from '@angular/core';
import { from, Observable, of, map, switchMap, catchError, throwError } from 'rxjs';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../supabase.config';
import { createClient } from '@supabase/supabase-js';
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

  // Demo credentials loaded from environment or config
  // In production, these should be moved to environment variables
  private readonly DEMO_CREDENTIALS: Record<string, { password: string; admin: Admin }> = {
    admin: {
      password: 'admin',
      admin: { username: 'admin@demo.com', name: 'Demo Admin', role: 'admin' }
    },
    steventok: {
      password: '1234567',
      admin: { username: 'steventok', name: 'Steven Tok (Owner)', role: 'admin' }
    },
    'steventok7@example.com': {
      password: '1234567',
      admin: { username: 'steventok7@example.com', name: 'Steven Tok', role: 'admin' }
    }
  };

  // --- Database Setup Check ---

  checkDatabaseSetup(): Observable<DatabaseStatus> {
    // Check if user has replaced placeholder credentials
    if (SUPABASE_URL.includes('your-project-id')) {
      return of({
        ready: false,
        errors: ['Invalid Supabase Configuration: Please update src/supabase.config.ts with your real Project URL and API Key.']
      });
    }

    // Checks if the 'profiles' table exists and is accessible
    return from(supabase.from('profiles').select('*', { count: 'exact', head: true })).pipe(
      map(({ error, status }) => {
        // Status 0 usually indicates a network failure
        if (status === 0) {
          return { ready: false, errors: ['Network Error: Could not reach Supabase. Check your internet connection or Project URL.'] };
        }

        // PGRST204/42P01 error codes indicate table doesn't exist
        if (error && (error.code === 'PGRST204' || error.code === '42P01')) {
          return { ready: false, errors: ['Tables not created. Run DATABASE_SETUP.md SQL in Supabase.'] };
        }

        // General connection error (that isn't missing table)
        if (error && !['PGRST116', '406'].includes(error.code || '')) {
          console.log('DB Check Warning:', error);
        }

        return { ready: true };
      }),
      catchError((err) => {
        console.error('Database check failed:', err);
        return of({ ready: false, errors: ['Failed to connect to database. Please try again.'] });
      })
    );
  }

  // --- Authentication ---

  adminLogin(creds: { username: string; password: string }): Observable<AdminLoginResponse> {
    // Validate input
    if (!creds.username?.trim() || !creds.password) {
      return of({ success: false, error: 'Username and password are required.' });
    }

    const trimmedUsername = creds.username.trim().toLowerCase();

    // Check demo credentials
    const demoMatch = this.DEMO_CREDENTIALS[trimmedUsername];
    if (demoMatch && demoMatch.password === creds.password) {
      return of({
        success: true,
        admin: demoMatch.admin
      });
    }

    // Real Supabase Login
    return from(supabase.auth.signInWithPassword({ email: creds.username, password: creds.password })).pipe(
      switchMap(async ({ data, error }) => {
        if (error) {
          return { success: false, error: error.message };
        }

        if (!data?.user?.id) {
          return { success: false, error: 'Authentication failed. Please try again.' };
        }

        try {
          // Verify Role in Profiles table
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileError) {
            await supabase.auth.signOut();
            return { success: false, error: 'Failed to fetch user profile.' };
          }

          if (!profile || profile.role !== 'admin') {
            await supabase.auth.signOut();
            return { success: false, error: 'Access denied: Not an admin account.' };
          }

          return {
            success: true,
            admin: { username: profile.email, name: profile.name, role: profile.role }
          };
        } catch (err) {
          await supabase.auth.signOut();
          return { success: false, error: 'An unexpected error occurred.' };
        }
      }),
      catchError((err) => {
        console.error('Admin login failed:', err);
        return of({ success: false, error: 'Login failed. Please try again.' });
      })
    );
  }

  employeeLogin(creds: { employeeId: string; pin: string }): Observable<EmployeeLoginResponse> {
    // Validate input
    if (!creds.employeeId?.trim() || !creds.pin) {
      return of({ success: false, error: 'Employee ID and PIN are required.' });
    }

    // Assuming 'employeeId' input is email for Supabase Auth
    // In a real app with 'Employee ID' login, you'd need a lookup table or Edge Function.
    return from(supabase.auth.signInWithPassword({ email: creds.employeeId, password: creds.pin })).pipe(
      switchMap(async ({ data, error }) => {
        if (error) {
          return { success: false, error: error.message };
        }

        if (!data?.user?.id) {
          return { success: false, error: 'Authentication failed. Please try again.' };
        }

        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileError || !profile) {
            await supabase.auth.signOut();
            return { success: false, error: 'Profile not found.' };
          }

          // Construct Employee object with proper typing
          const emp: Employee = {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            role: profile.role || 'employee',
            job_title: profile.job_title,
            status: profile.status
          };
          return { success: true, employee: emp };
        } catch (err) {
          await supabase.auth.signOut();
          return { success: false, error: 'An unexpected error occurred.' };
        }
      }),
      catchError((err) => {
        console.error('Employee login failed:', err);
        return of({ success: false, error: 'Login failed. Please try again.' });
      })
    );
  }

  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (err) {
      console.error('Sign out failed:', err);
      return { error: err instanceof Error ? err : new Error('Sign out failed') };
    }
  }

  // --- Admin Dashboard Data ---

  getAdminSummary(): Observable<AdminSummary> {
    const today = new Date().toISOString().split('T')[0];

    // Use Promise.allSettled for resilient error handling
    return from(Promise.allSettled([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('date', today),
      supabase.from('requests').select('*', { count: 'exact', head: true }).eq('type', 'leave').eq('status', 'approved').lte('start_date', today).gte('end_date', today)
    ])).pipe(
      map(([empsResult, attsResult, leavesResult]) => {
        // Safely extract counts, defaulting to 0 if query failed
        const totalEmployees = empsResult.status === 'fulfilled' ? (empsResult.value.count || 0) : 0;
        const presentToday = attsResult.status === 'fulfilled' ? (attsResult.value.count || 0) : 0;
        const onLeave = leavesResult.status === 'fulfilled' ? (leavesResult.value.count || 0) : 0;

        return { totalEmployees, presentToday, onLeave };
      }),
      catchError((err) => {
        console.error('Failed to fetch admin summary:', err);
        return of({ totalEmployees: 0, presentToday: 0, onLeave: 0 });
      })
    );
  }

  // --- Employee Management (Admin) ---

  getEmployees(): Observable<Employee[]> {
    // Fetches employees and joins private_details for salary info
    return from(supabase.from('profiles').select('*, private_details(*)')).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Failed to fetch employees:', error);
          return [];
        }
        return (data || []).map((p: any) => {
          // Handle private_details being returned as an array or object
          const details = Array.isArray(p.private_details) ? p.private_details[0] : p.private_details;

          return {
            id: p.id,
            name: p.name || p.email?.split('@')[0] || 'Unknown User',
            email: p.email,
            role: p.job_title || p.role || 'No Job Title',
            salary: details?.monthly_salary_idr || details?.hourly_rate_idr || 0,
            schedule: {},
            status: p.status || 'active'
          };
        });
      }),
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
    const pin = data['pin'];
    if (!pin || String(pin).length < 6) {
      return of({ success: false, error: 'PIN/Password must be at least 6 characters.' });
    }

    // REAL IMPLEMENTATION: Create Auth User via Secondary Client (to avoid Admin logout)
    return from((async () => {
      try {
        // 1. Create temporary client
        const tempClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        });

        // 2. Sign Up (Create User)
        const { data: authData, error: authError } = await tempClient.auth.signUp({
          email: data.email,
          password: String(pin),
          options: {
            data: { name: data.name } // Metadata for Trigger
          }
        });

        if (authError) {
          return { success: false, error: authError.message };
        }

        if (!authData.user) {
          return { success: false, error: 'Failed to create user.' };
        }

        const newId = authData.user.id;

        // 3. Update Profile (using Admin privileges of Main Client)
        // We reuse updateEmployee logic logic manually here to ensure we hit the right ID
        const { error: pError } = await supabase.from('profiles').update({
          name: data.name,
          job_title: data.job_title || data.role,
          employment_type: data.employment_type,
          status: data.status || 'active',
          phone_number: data['phone_number'],
          date_of_birth: data['date_of_birth'],
          gender: data['gender'],
          start_date: data['start_date']
        }).eq('id', newId);

        if (pError) throw pError;

        // 4. Update Private Details
        const { error: dError } = await supabase.from('private_details').update({
          monthly_salary_idr: data.salary,
          hourly_rate_idr: data['hourly_rate_idr'], // Ensure this maps if passed
          address: data['address'],
          national_id: data['national_id'],
          emergency_contact_name: data['emergency_contact_name'],
          emergency_contact_phone: data['emergency_contact_phone'],
          probation_end_date: data['probation_end_date']
        }).eq('id', newId);

        if (dError) console.error('Details update caution:', dError);

        return { success: true, employee: { ...data, id: newId } as Employee };

      } catch (e: any) {
        console.error('Add Employee Failed:', e);
        return { success: false, error: e.message || 'Failed to create employee.' };
      }
    })());
  }

  updateEmployee(data: Partial<Employee> & { id: string }): Observable<OperationResponse> {
    // Validate required fields
    if (!data.id) {
      return of({ success: false, error: 'Employee ID is required.' });
    }

    return from((async () => {
      try {
        const { error: pError } = await supabase.from('profiles').update({
          name: data.name,
          job_title: data.job_title || data.role,
          employment_type: data.employment_type,
          status: data.status,
          phone_number: data['phone_number'],
          date_of_birth: data['date_of_birth'],
          gender: data['gender'],
          start_date: data['start_date']
        }).eq('id', data.id);

        if (pError) {
          return { success: false, error: pError.message };
        }

        if (data.salary !== undefined || data['address'] || data['national_id']) {
          const { error: dError } = await supabase.from('private_details').update({
            monthly_salary_idr: data.salary,
            address: data['address'],
            national_id: data['national_id'],
            emergency_contact_name: data['emergency_contact_name'],
            emergency_contact_phone: data['emergency_contact_phone'],
            probation_end_date: data['probation_end_date']
          }).eq('id', data.id);
          if (dError) {
            console.error('Failed to update details:', dError);
          }
        }


        return { success: true };
      } catch (err) {
        console.error('Failed to update employee:', err);
        return { success: false, error: 'Failed to update employee. Please try again.' };
      }
    })());
  }

  deleteEmployee(id: string): Observable<OperationResponse> {
    if (!id) {
      return of({ success: false, error: 'Employee ID is required.' });
    }

    return from(supabase.from('profiles').delete().eq('id', id)).pipe(
      map(({ error }) => ({ success: !error, error: error?.message })),
      catchError((err) => {
        console.error('Failed to delete employee:', err);
        return of({ success: false, error: 'Failed to delete employee. Please try again.' });
      })
    );
  }

  updateSchedule(data: { employeeId: string; schedule: Record<string, boolean> }): Observable<OperationResponse> {
    // Stub: Schedule column not in schema
    if (!data.employeeId) {
      return of({ success: false, error: 'Employee ID is required.' });
    }
    return of({ success: true });
  }

  getEmployeeDetails(id: string): Observable<{
    details: FullEmployeeDetails | null;
    attendance: Array<Attendance & { hours: string }>;
    leave: Array<{ from: string; to: string; reason: string; status: string }>;
    claims: Array<{ date: string; amount: number; description: string; status: string }>;
  }> {
    if (!id) {
      return of({ details: null, attendance: [], leave: [], claims: [] });
    }

    return from(Promise.allSettled([
      supabase.from('profiles').select('*, private_details(*)').eq('id', id).single(),
      supabase.from('attendance').select('*').eq('employee_id', id).order('date', { ascending: false }).limit(20),
      supabase.from('requests').select('*').eq('employee_id', id).eq('type', 'leave').order('created_at', { ascending: false }),
      supabase.from('requests').select('*').eq('employee_id', id).eq('type', 'claim').order('created_at', { ascending: false })
    ])).pipe(
      map(([profileResult, attResult, leaveResult, claimsResult]) => {
        // Safely extract data from each result
        const profileData = profileResult.status === 'fulfilled' ? profileResult.value.data : null;
        const attData = attResult.status === 'fulfilled' ? (attResult.value.data || []) : [];
        const leaveData = leaveResult.status === 'fulfilled' ? (leaveResult.value.data || []) : [];
        const claimsData = claimsResult.status === 'fulfilled' ? (claimsResult.value.data || []) : [];

        return {
          details: profileData ? { ...profileData, ...(profileData.private_details || {}) } : null,
          attendance: attData.map((a: SupabaseAttendance) => ({
            ...a,
            hours: a.total_minutes != null ? (a.total_minutes / 60).toFixed(1) : '-'
          })),
          leave: leaveData.map((l: Request) => ({
            from: l.start_date || '',
            to: l.end_date || '',
            reason: l.reason || '',
            status: l.status
          })),
          claims: claimsData.map((c: Request) => ({
            date: c.created_at?.split('T')[0] || '',
            amount: c.amount || 0,
            description: c.reason || '',
            status: c.status
          }))
        };
      }),
      catchError((err) => {
        console.error('Failed to fetch employee details:', err);
        return of({ details: null, attendance: [], leave: [], claims: [] });
      })
    );
  }

  getFullEmployeeDetails(id: string): Observable<FullEmployeeDetails | null> {
    if (!id) {
      return of(null);
    }

    return from(Promise.allSettled([
      supabase.from('profiles').select('*').eq('id', id).single(),
      supabase.from('private_details').select('*').eq('id', id).single()
    ])).pipe(
      map(([profileResult, detailsResult]) => {
        const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : null;
        const details = detailsResult.status === 'fulfilled' ? detailsResult.value.data : null;

        if (!profile) return null;
        return { ...profile, ...details } as FullEmployeeDetails;
      }),
      catchError((err) => {
        console.error('Failed to fetch full employee details:', err);
        return of(null);
      })
    );
  }

  // --- Attendance ---

  checkIn(data: { employeeId: string; latitude: number; longitude: number }): Observable<OperationResponse> {
    if (!data.employeeId) {
      return of({ success: false, error: 'Employee ID is required.' });
    }

    const date = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    return from(supabase.from('attendance').select('*').eq('employee_id', data.employeeId).eq('date', date).single()).pipe(
      switchMap(({ data: existing, error }) => {
        // PGRST116 means no row found, which is expected for first check-in
        if (error && error.code !== 'PGRST116') {
          console.error('Check-in query error:', error);
          return of({ success: false, error: 'Failed to verify attendance status.' });
        }

        if (existing) {
          return of({ success: false, error: 'Already checked in today.' });
        }

        return from(supabase.from('attendance').insert({
          employee_id: data.employeeId,
          date: date,
          check_in: now
        })).pipe(
          map(res => ({
            success: !res.error,
            error: res.error?.message
          }))
        );
      }),
      catchError((err) => {
        console.error('Check-in failed:', err);
        return of({ success: false, error: 'Check-in failed. Please try again.' });
      })
    );
  }

  checkOut(data: { employeeId: string }): Observable<OperationResponse & { hours?: string }> {
    if (!data.employeeId) {
      return of({ success: false, error: 'Employee ID is required.' });
    }

    const date = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    return from(supabase.from('attendance').select('*').eq('employee_id', data.employeeId).eq('date', date).single()).pipe(
      switchMap(({ data: existing, error }) => {
        if (error || !existing) {
          return of({ success: false, error: 'No check-in record found for today.' });
        }

        if (existing.check_out) {
          return of({ success: false, error: 'Already checked out.' });
        }

        if (!existing.check_in) {
          return of({ success: false, error: 'Invalid check-in record.' });
        }

        const checkInTime = new Date(existing.check_in).getTime();
        const checkOutTime = new Date(now).getTime();
        const totalMinutes = Math.max(0, Math.floor((checkOutTime - checkInTime) / (1000 * 60)));

        return from(supabase.from('attendance').update({
          check_out: now,
          total_minutes: totalMinutes
        }).eq('id', existing.id)).pipe(
          map(res => ({
            success: !res.error,
            hours: (totalMinutes / 60).toFixed(1),
            error: res.error?.message
          }))
        );
      }),
      catchError((err) => {
        console.error('Check-out failed:', err);
        return of({ success: false, error: 'Check-out failed. Please try again.' });
      })
    );
  }

  getAllAttendance(): Observable<Array<SupabaseAttendance & { employeeName: string; hours: string }>> {
    return from(supabase.from('attendance').select('*, profiles(name)').order('date', { ascending: false }).limit(100)).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Failed to fetch attendance:', error);
          return [];
        }
        return (data || []).map((r: SupabaseAttendance) => ({
          ...r,
          employeeName: r.profiles?.name || 'Unknown',
          hours: r.total_minutes != null ? (r.total_minutes / 60).toFixed(1) : '-'
        }));
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

    return from(Promise.allSettled([
      supabase.from('attendance')
        .select('*')
        .eq('employee_id', employeeId)
        .order('date', { ascending: false })
        .limit(30),
      // Stats calculation - in production, this should be a server-side calculation
      Promise.resolve({ leaveDaysAvailable: 12, sickDaysTaken: 0, pendingClaims: 0 })
    ])).pipe(
      map(([attResult, statsResult]) => {
        const attData = attResult.status === 'fulfilled' ? (attResult.value.data || []) : [];
        const stats = statsResult.status === 'fulfilled' ? statsResult.value : { leaveDaysAvailable: 0, sickDaysTaken: 0, pendingClaims: 0 };

        const formattedAtt: Attendance[] = attData.map((r: SupabaseAttendance) => ({
          ...r,
          hours: r.total_minutes != null ? (r.total_minutes / 60).toFixed(1) : '-'
        }));

        return { attendance: formattedAtt, summary: stats };
      }),
      catchError((err) => {
        console.error('Failed to fetch employee history:', err);
        return of({ attendance: [], summary: { leaveDaysAvailable: 0, sickDaysTaken: 0, pendingClaims: 0 } });
      })
    );
  }

  // --- Requests ---

  submitLeaveRequest(data: { employeeId: string; fromDate: string; toDate: string; reason: string }): Observable<OperationResponse> {
    // Validate required fields
    if (!data.employeeId || !data.fromDate || !data.toDate) {
      return of({ success: false, error: 'Employee ID and dates are required.' });
    }

    return from(supabase.from('requests').insert({
      employee_id: data.employeeId,
      type: 'leave',
      start_date: data.fromDate,
      end_date: data.toDate,
      reason: data.reason || ''
    })).pipe(
      map(({ error }) => ({
        success: !error,
        error: error?.message
      })),
      catchError((err) => {
        console.error('Failed to submit leave request:', err);
        return of({ success: false, error: 'Failed to submit leave request. Please try again.' });
      })
    );
  }

  submitSickReport(data: { employeeId: string; date: string; notes?: string }): Observable<OperationResponse> {
    // Validate required fields
    if (!data.employeeId || !data.date) {
      return of({ success: false, error: 'Employee ID and date are required.' });
    }

    return from(supabase.from('requests').insert({
      employee_id: data.employeeId,
      type: 'sick',
      start_date: data.date,
      end_date: data.date,
      reason: data.notes || ''
    })).pipe(
      map(({ error }) => ({
        success: !error,
        error: error?.message
      })),
      catchError((err) => {
        console.error('Failed to submit sick report:', err);
        return of({ success: false, error: 'Failed to submit sick report. Please try again.' });
      })
    );
  }

  submitExpenseClaim(data: { employeeId: string; amount: number; description: string; date?: string }): Observable<OperationResponse> {
    // Validate required fields
    if (!data.employeeId || data.amount == null || data.amount <= 0) {
      return of({ success: false, error: 'Employee ID and valid amount are required.' });
    }

    return from(supabase.from('requests').insert({
      employee_id: data.employeeId,
      type: 'claim',
      amount: data.amount,
      reason: data.description || '',
      created_at: data.date ? new Date(data.date).toISOString() : new Date().toISOString()
    })).pipe(
      map(({ error }) => ({
        success: !error,
        error: error?.message
      })),
      catchError((err) => {
        console.error('Failed to submit expense claim:', err);
        return of({ success: false, error: 'Failed to submit expense claim. Please try again.' });
      })
    );
  }

  getRequests(type?: 'leave' | 'sick' | 'claim'): Observable<Request[]> {
    let query = supabase.from('requests').select('*, profiles(name)').order('created_at', { ascending: false });
    if (type) {
      query = query.eq('type', type);
    }

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Failed to fetch requests:', error);
          return [];
        }
        return (data as Request[]) || [];
      }),
      catchError((err) => {
        console.error('Failed to fetch requests:', err);
        return of([]);
      })
    );
  }

  // --- Payroll ---

  async generatePayroll(year: number, month: number): Promise<PayrollEntry[]> {
    // Validate input
    if (!year || !month || month < 1 || month > 12) {
      console.error('Invalid year or month provided to generatePayroll');
      return [];
    }

    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

      // Fetch all required data in parallel with error handling
      const [employeesResult, attendanceResult, claimsResult] = await Promise.allSettled([
        supabase.from('profiles').select('*, private_details (*)'),
        supabase.from('attendance')
          .select('employee_id, total_minutes')
          .gte('date', startDate)
          .lte('date', endDate),
        supabase.from('requests')
          .select('employee_id, amount')
          .eq('type', 'claim')
          .eq('status', 'approved')
          .gte('created_at', `${startDate}T00:00:00`)
          .lte('created_at', `${endDate}T23:59:59`)
      ]);

      // Extract employees data
      const employees = employeesResult.status === 'fulfilled' ? employeesResult.value.data : null;
      if (!employees || employees.length === 0) {
        return [];
      }

      // Extract attendance and claims data
      const attendance = attendanceResult.status === 'fulfilled' ? (attendanceResult.value.data || []) : [];
      const claims = claimsResult.status === 'fulfilled' ? (claimsResult.value.data || []) : [];

      // Generate payroll entries
      return employees.map((emp: SupabaseProfile) => {
        const details = emp.private_details;
        const empAttendance = attendance.filter((a: { employee_id: string }) => a.employee_id === emp.id);
        const empClaims = claims.filter((c: { employee_id: string }) => c.employee_id === emp.id);

        const totalMinutes = empAttendance.reduce(
          (sum: number, r: { total_minutes?: number }) => sum + (r.total_minutes || 0),
          0
        );
        const totalHours = totalMinutes / 60;

        let baseSalary = 0;
        if (emp.employment_type === 'full_time') {
          baseSalary = details?.monthly_salary_idr || 0;
        } else {
          baseSalary = (details?.hourly_rate_idr || 0) * totalHours;
        }

        const approvedClaims = empClaims.reduce(
          (sum: number, c: { amount?: number }) => sum + (c.amount || 0),
          0
        );

        return {
          employeeId: emp.id,
          name: emp.name,
          employmentType: (emp.employment_type || 'part_time') as 'full_time' | 'part_time',
          baseSalary,
          totalAttendanceHours: totalHours,
          approvedClaims,
          netPay: baseSalary + approvedClaims
        };
      });
    } catch (err) {
      console.error('Failed to generate payroll:', err);
      return [];
    }
  }
}
