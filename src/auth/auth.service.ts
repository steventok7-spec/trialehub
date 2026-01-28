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
   * Authenticate user with email and password
   * This is the main login method - handles Supabase auth + local state in one call
   * 
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise with success status and optional error message
   */
  async loginWithPassword(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error || !data.session) {
        console.error('Supabase auth failed:', error);
        return {
          success: false,
          error: error?.message || 'Invalid credentials'
        };
      }

      // 2. Store Supabase session
      this.supabaseSession = data.session;

      // 3. Fetch and hydrate user profile from database
      await this.hydrateUserFromSupabase(data.user.id);

      // 4. Verify hydration succeeded
      if (!this.currentUser()) {
        return {
          success: false,
          error: 'Failed to load user profile'
        };
      }

      return { success: true };

    } catch (err) {
      console.error('Login error:', err);
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
  }

  /**
   * @deprecated Use loginWithPassword(email, password) instead
   * 
   * This method is confusing because it doesn't actually authenticate.
   * It only sets local state after you've already authenticated elsewhere.
   * Kept for backward compatibility only.
   */
  login(user: AuthUser | Record<string, unknown> | { [key: string]: unknown }, role: 'owner' | 'employee'): void {
    console.warn('⚠️  AuthService.login() is deprecated. Use loginWithPassword(email, password) instead.');
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

  async logout(): Promise<void> {
    // Sign out from Supabase
    await supabase.auth.signOut();

    // Clear local state
    this.clearSession();
    this.currentUser.set(null);
    this.supabaseSession = null;

    // Navigate to login
    this.router.navigate(['/']);
  }
}
