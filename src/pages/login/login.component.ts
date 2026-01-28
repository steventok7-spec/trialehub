
import { Component, OnInit, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../auth/auth.service';
import { IconComponent } from '../../components/ui/icon.component';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 flex flex-col items-center justify-center p-5 relative">
      
      <!-- Connection Status - Subtle top indicator -->
      <div class="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
        @if (checkingDb()) {
          <div class="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur rounded-full border border-zinc-200 shadow-sm">
            <div class="w-2 h-2 bg-zinc-400 rounded-full animate-pulse"></div>
            <span class="text-xs font-medium text-zinc-500">Connecting...</span>
          </div>
        } @else if (dbStatus()?.ready) {
          <div class="flex items-center gap-2 px-3 py-1.5 bg-emerald-50/80 backdrop-blur rounded-full border border-emerald-200 shadow-sm">
            <div class="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span class="text-xs font-semibold text-emerald-700">Online</span>
          </div>
        } @else {
          <button (click)="checkDatabaseSetup()" class="flex items-center gap-2 px-3 py-1.5 bg-rose-50/80 hover:bg-rose-100 backdrop-blur rounded-full border border-rose-200 shadow-sm transition-colors">
            <div class="w-2 h-2 bg-rose-500 rounded-full"></div>
            <span class="text-xs font-semibold text-rose-700">Offline</span>
          </button>
        }
      </div>

      <div class="w-full max-w-sm">
        <!-- Logo & Branding (Text Only) -->
        <div class="text-center mb-10">
          <h1 class="text-4xl font-bold text-zinc-900 tracking-tight">SUKHA</h1>
          <p class="text-sm text-zinc-500 mt-2">Employee Management Hub</p>
        </div>

        <!-- Database Error Alert -->
        @if (dbStatus() && !dbStatus()!.ready) {
          <div class="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl">
            <div class="flex gap-3">
              <app-icon name="alert-triangle" class="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 class="text-sm font-semibold text-rose-800 mb-1">Connection Issue</h3>
                <p class="text-xs text-rose-700 leading-relaxed">
                  Unable to connect to database. Please check your configuration.
                </p>
                @if (dbStatus()?.errors && dbStatus()!.errors.length > 0) {
                  <details class="mt-2">
                    <summary class="text-xs text-rose-600 cursor-pointer hover:text-rose-800">View details</summary>
                    <ul class="text-xs text-rose-600 list-disc list-inside mt-2 space-y-1 bg-rose-100/50 p-2 rounded">
                      @for (error of dbStatus()?.errors; track $index) {
                        <li>{{ error }}</li>
                      }
                    </ul>
                  </details>
                }
              </div>
            </div>
          </div>
        }

        <!-- Login Form Card -->
        <div class="bg-white rounded-2xl shadow-xl shadow-zinc-200/50 p-6 sm:p-8 border border-zinc-100">
          <h2 class="text-xl font-semibold text-zinc-900 mb-6 text-center">Sign In</h2>
          
          <form (submit)="handleLogin($event)" class="space-y-5">
            <!-- Email Input -->
            <div>
              <label class="block text-sm font-medium text-zinc-600 mb-2">Email Address</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <app-icon name="mail" class="w-5 h-5 text-zinc-400" />
                </div>
                <input
                  type="email"
                  [(ngModel)]="loginId"
                  name="loginId"
                  placeholder="Enter your email"
                  class="w-full pl-12 pr-4 py-3.5 border border-zinc-200 bg-zinc-50 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent focus:bg-white transition-all text-base"
                  autocomplete="email"
                />
              </div>
            </div>

            <!-- Password Input -->
            <div>
              <label class="block text-sm font-medium text-zinc-600 mb-2">Password</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <app-icon name="lock" class="w-5 h-5 text-zinc-400" />
                </div>
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  [(ngModel)]="password"
                  name="password"
                  placeholder="Enter your password"
                  class="w-full pl-12 pr-12 py-3.5 border border-zinc-200 bg-zinc-50 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent focus:bg-white transition-all text-base"
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  (click)="togglePassword()"
                  class="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  @if (showPassword()) {
                    <app-icon name="eye-off" class="w-5 h-5 text-zinc-400 hover:text-zinc-600 transition-colors" />
                  } @else {
                    <app-icon name="eye" class="w-5 h-5 text-zinc-400 hover:text-zinc-600 transition-colors" />
                  }
                </button>
              </div>
            </div>

            <!-- Login Button -->
            <button
              type="submit"
              [disabled]="loading()"
              class="w-full py-4 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-lg shadow-zinc-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex justify-center items-center gap-2 min-h-[56px]"
            >
              @if (loading()) {
                <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Signing in...</span>
              } @else {
                <span>Sign In</span>
                <app-icon name="chevrons-right" class="w-5 h-5" />
              }
            </button>
          </form>

          <!-- Self Registration Link -->
          <div class="mt-6 text-center">
            <p class="text-sm text-zinc-500">
              New here? 
              <a routerLink="/register" class="text-zinc-900 font-bold hover:underline">Join as Team Member</a>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-8 text-center">
          <p class="text-xs text-zinc-400">© 2026 SUKHA. All rights reserved.</p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  loginId = '';
  password = '';
  showPassword = signal(false);
  loading = signal(false);
  dbStatus = signal<{ ready: boolean; errors?: string[] } | null>(null);
  checkingDb = signal(true);

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      if (user.role === 'owner') {
        this.router.navigate(['/admin/dashboard']);
      } else {
        this.router.navigate(['/employee/dashboard']);
      }
      return;
    }
    this.checkDatabaseSetup();
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  checkDatabaseSetup(): void {
    this.checkingDb.set(true);
    this.api.checkDatabaseSetup().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.checkingDb.set(false))
    ).subscribe({
      next: (status) => {
        this.dbStatus.set(status);
        if (!status.ready) {
          console.warn('Supabase Check Failed:', status.errors);
        }
      },
      error: (err) => {
        console.error('Network Error checking DB:', err);
        this.dbStatus.set({ ready: false, errors: ['Network error. Check console for details.'] });
      }
    });
  }


  testConnection(): void {
    this.toast.info('Testing connection to Supabase...');
    this.api.checkDatabaseSetup().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (status) => {
        if (status.ready) {
          this.toast.success('Connection Successful! Tables found.');
        } else {
          this.toast.error(status.errors?.[0] || 'Connection Failed');
        }
      },
      error: () => {
        this.toast.error('Connection test failed. Please try again.');
      }
    });
  }

  handleLogin(e: Event): void {
    e.preventDefault();

    const trimmedLoginId = this.loginId.trim();
    const trimmedPassword = this.password.trim();

    if (!trimmedLoginId || !trimmedPassword) {
      this.toast.error('Please enter both credentials');
      return;
    }

    if (this.dbStatus() && !this.dbStatus()!.ready) {
      this.toast.error('Database connection failed. Check your config.');
      return;
    }

    this.loading.set(true);

    // Smart login: try to detect role automatically
    this.attemptSmartLogin(trimmedLoginId, trimmedPassword);
  }

  private attemptSmartLogin(loginId: string, password: string): void {
    // Try owner login first
    this.api.adminLogin({ username: loginId, password }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        if (data.success && data.admin) {
          this.loading.set(false);
          this.authService.login(data.admin, 'owner');
          this.toast.success('Welcome back, Owner!');
          this.router.navigate(['/admin/dashboard']);
        } else if (data.error && (data.error.includes('Access denied') || data.error.includes('Profile not found'))) {
          // If we specifically found the user but they aren't an owner, or have no profile, stop here
          this.loading.set(false);
          this.toast.error(data.error);
        } else {
          // General auth failure (like invalid credentials), try as employee
          this.attemptEmployeeLogin(loginId, password);
        }
      },
      error: () => {
        this.attemptEmployeeLogin(loginId, password);
      }
    });
  }


  private attemptEmployeeLogin(loginId: string, password: string): void {
    this.api.employeeLogin({ email: loginId, pin: password }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (data) => {
        if (data.success && data.employee) {
          this.authService.login(data.employee, 'employee');
          this.toast.success(`Welcome back, ${data.employee.name}!`);
          this.router.navigate(['/employee/dashboard']);
        } else {
          this.toast.error(data.error || 'Invalid credentials. Please check your email/username and password.');
        }
      },
      error: (err) => {
        this.toast.error('Authentication error. Please try again.');
      }
    });
  }
}
