import { Injectable, signal, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { supabase } from '../supabase.config';
import type { Session } from '@supabase/supabase-js';

export interface AuthUser {
  id?: string;
  name: string;
  email?: string;
  username?: string;
  role: 'owner' | 'employee';
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
  private supabaseSession: Session | null = null;

  constructor(private router: Router) {
    this.initializeSession();
    this.startSessionCheck();
    this.setupAuthListener();
  }

  ngOnDestroy(): void {
    this.stopSessionCheck();
  }

  /**
   * Initialize session from Supabase (single source of truth)
   * This runs on app start and ensures localStorage never overrides Supabase
   */
  private async initializeSession(): Promise<void> {
    try {
      // Get current Supabase session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Failed to get Supabase session:', error);
        this.clearSession();
        return;
      }

      if (!session) {
        // No Supabase session - clear any localStorage remnants
        this.clearSession();
        return;
      }

      // Valid Supabase session exists - fetch profile and hydrate
      this.supabaseSession = session;
      await this.hydrateUserFromSupabase(session.user.id);

    } catch (error) {
      console.error('Session initialization failed:', error);
      this.clearSession();
    }
  }

  /**
   * Fetch user profile from Supabase and set currentUser
   */
  private async hydrateUserFromSupabase(userId: string): Promise<void> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        console.error('Failed to fetch profile:', error);
        this.clearSession();
        return;
      }

      const authUser: AuthUser = {
        id: profile.id,
        name: profile.name || profile.email?.split('@')[0] || 'Unknown',
        email: profile.email,
        role: profile.role === 'owner' ? 'owner' : 'employee',
        job_title: profile.job_title,
        status: profile.status
      };

      this.currentUser.set(authUser);
      this.saveSession(authUser);

    } catch (error) {
      console.error('Failed to hydrate user from Supabase:', error);
      this.clearSession();
    }
  }

  /**
   * Listen to Supabase auth state changes
   */
  private setupAuthListener(): void {
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);

      if (event === 'SIGNED_OUT' || !session) {
        this.clearSession();
        this.currentUser.set(null);
        this.supabaseSession = null;
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        this.supabaseSession = session;
        await this.hydrateUserFromSupabase(session.user.id);
      }
    });
  }

  /**
   * Get current Supabase session (for guards and API calls)
   */
  async getSupabaseSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    this.supabaseSession = session;
    return session;
  }

  private loadUserFromStorage(): void {
    // This is now only used as a fallback for quick UI hydration
    // Supabase session is the source of truth
    try {
      const sessionJson = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!sessionJson) {
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
        // Only set if we don't have a user yet (prevents override)
        if (!this.currentUser()) {
          this.currentUser.set(session.user);
        }
      } else {
        this.clearSession();
      }
    } catch (error) {
      console.error('Failed to load user from storage:', error);
      this.clearSession();
    }
  }

  /** Validate that user object has required properties */
  private isValidUser(user: unknown): user is AuthUser {
    if (!user || typeof user !== 'object') return false;
    const u = user as Record<string, unknown>;
    return (
      typeof u['name'] === 'string' &&
      u['name'].length > 0 &&
      (u['role'] === 'owner' || u['role'] === 'employee')
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
  private async validateSession(): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // No Supabase session - logout
        if (this.currentUser()) {
          this.logout();
        }
        return;
      }

      // Supabase session exists - verify localStorage matches
      const sessionJson = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!sessionJson) {
        // localStorage cleared but Supabase session exists - re-hydrate
        await this.hydrateUserFromSupabase(session.user.id);
        return;
      }

      const localSession: SessionData = JSON.parse(sessionJson);
      if (Date.now() > localSession.expiresAt) {
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

  hasRole(role: 'owner' | 'employee'): boolean {
    return this.currentUser()?.role === role;
  }

  /**
   * Login user - must be called AFTER successful Supabase authentication
   * This sets the local state based on the authenticated Supabase session
   */
  login(user: AuthUser | Record<string, unknown> | { [key: string]: unknown }, role: 'owner' | 'employee'): void {
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

<<<<<<< HEAD
  logout(): void {
    // Clear Supabase session to prevent token reuse
    supabase.auth.signOut().catch(err => console.error('Supabase signout failed:', err));
=======
  async logout(): Promise<void> {
    // Sign out from Supabase
    await supabase.auth.signOut();

    // Clear local state
>>>>>>> d7e4a9b (chore: update owner email to steventok@sukhapku.com)
    this.clearSession();
    this.currentUser.set(null);
    this.supabaseSession = null;

    // Navigate to login
    this.router.navigate(['/']);
  }
}
