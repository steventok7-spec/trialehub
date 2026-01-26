import { Injectable, signal, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { supabase } from '../supabase.config';

/** User session data stored in the auth service */
export interface AuthUser {
  id?: string;
  name: string;
  email?: string;
  username?: string;
  role: 'admin' | 'employee';
  job_title?: string;
  status?: string;
}

/** Session metadata for timeout management */
interface SessionData {
  user: AuthUser;
  expiresAt: number;
}

// Session timeout duration (8 hours in milliseconds)
const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000;
const SESSION_STORAGE_KEY = 'sukha_session';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {

  currentUser = signal<AuthUser | null>(null);

  private sessionCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private router: Router) {
    this.loadUserFromStorage();
    this.startSessionCheck();
  }

  ngOnDestroy(): void {
    this.stopSessionCheck();
  }

  private loadUserFromStorage(): void {
    try {
      const sessionJson = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!sessionJson) {
        // Check for legacy storage format and migrate
        this.migrateLegacyStorage();
        return;
      }

      const session: SessionData = JSON.parse(sessionJson);

      // Check if session has expired
      if (Date.now() > session.expiresAt) {
        this.clearSession();
        return;
      }

      // Validate user object structure
      if (this.isValidUser(session.user)) {
        this.currentUser.set(session.user);
      } else {
        this.clearSession();
      }
    } catch (error) {
      console.error('Failed to load user from storage:', error);
      this.clearSession();
    }
  }

  /** Migrate from old storage format (admin/employee keys) to new session format */
  private migrateLegacyStorage(): void {
    try {
      const adminJson = localStorage.getItem('admin');
      const employeeJson = localStorage.getItem('employee');

      if (adminJson) {
        const admin = JSON.parse(adminJson);
        if (admin && typeof admin === 'object') {
          const user: AuthUser = { ...admin, role: 'admin' };
          this.saveSession(user);
          this.currentUser.set(user);
        }
        localStorage.removeItem('admin');
      } else if (employeeJson) {
        const employee = JSON.parse(employeeJson);
        if (employee && typeof employee === 'object') {
          const user: AuthUser = { ...employee, role: 'employee' };
          this.saveSession(user);
          this.currentUser.set(user);
        }
        localStorage.removeItem('employee');
      }
    } catch (error) {
      console.error('Failed to migrate legacy storage:', error);
    }
  }

  /** Validate that user object has required properties */
  private isValidUser(user: unknown): user is AuthUser {
    if (!user || typeof user !== 'object') return false;
    const u = user as Record<string, unknown>;
    return (
      typeof u['name'] === 'string' &&
      u['name'].length > 0 &&
      (u['role'] === 'admin' || u['role'] === 'employee')
    );
  }

  /** Save session with expiration timestamp */
  private saveSession(user: AuthUser): void {
    const session: SessionData = {
      user,
      expiresAt: Date.now() + SESSION_TIMEOUT_MS
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  /** Clear session from storage */
  private clearSession(): void {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem('admin'); // Clean up legacy keys
    localStorage.removeItem('employee');
  }

  /** Start periodic session validation check */
  private startSessionCheck(): void {
    // Check session validity every 5 minutes
    this.sessionCheckInterval = setInterval(() => {
      this.validateSession();
    }, 5 * 60 * 1000);
  }

  private stopSessionCheck(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  /** Validate current session and logout if expired */
  private validateSession(): void {
    try {
      const sessionJson = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!sessionJson) {
        if (this.currentUser()) {
          this.logout();
        }
        return;
      }

      const session: SessionData = JSON.parse(sessionJson);
      if (Date.now() > session.expiresAt) {
        this.logout();
      }
    } catch {
      this.logout();
    }
  }

  /** Extend session expiration (call on user activity) */
  extendSession(): void {
    const user = this.currentUser();
    if (user) {
      this.saveSession(user);
    }
  }

  isLoggedIn(): boolean {
    return !!this.currentUser();
  }

  hasRole(role: 'admin' | 'employee'): boolean {
    return this.currentUser()?.role === role;
  }

  login(user: AuthUser | Record<string, unknown> | { [key: string]: unknown }, role: 'admin' | 'employee'): void {
    if (!user || typeof user !== 'object') {
      console.error('Invalid user object provided to login');
      return;
    }

    // Cast to Record for safe property access
    const userData = user as Record<string, unknown>;

    const authUser: AuthUser = {
      id: (userData['id'] as string) || undefined,
      name: (userData['name'] as string) || 'Unknown User',
      email: (userData['email'] as string) || undefined,
      username: (userData['username'] as string) || undefined,
      role,
      job_title: (userData['job_title'] as string) || undefined,
      status: (userData['status'] as string) || undefined
    };

    this.saveSession(authUser);
    this.currentUser.set(authUser);
  }

  logout(): void {
    // Clear Supabase session to prevent token reuse
    supabase.auth.signOut().catch(err => console.error('Supabase signout failed:', err));
    this.clearSession();
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }
}
