import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../services/toast.service';
import { ButtonComponent } from '../../components/ui/button.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonComponent
  ],
  template: `
    <div class="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div class="w-full max-w-md">
        <div class="mb-8 text-center">
          <h1 class="text-3xl font-black text-zinc-900 mb-2">Sign Up</h1>
          <p class="text-sm text-zinc-600">Create your SUKHA account</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <div>
            <label class="block text-sm font-semibold text-zinc-900 mb-2">Full Name</label>
            <input
              type="text"
              formControlName="name"
              class="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label class="block text-sm font-semibold text-zinc-900 mb-2">Email</label>
            <input
              type="email"
              formControlName="email"
              class="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label class="block text-sm font-semibold text-zinc-900 mb-2">Password</label>
            <input
              type="password"
              formControlName="password"
              class="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-900"
              placeholder="••••••••"
            />
            <p class="text-xs text-zinc-500 mt-1">At least 6 characters</p>
          </div>

          <button
            type="submit"
            [disabled]="form.invalid || authService.isLoading()"
            class="w-full py-3 bg-zinc-900 text-white font-semibold rounded-lg hover:bg-zinc-800 disabled:opacity-50"
          >
            {{ authService.isLoading() ? 'Creating account...' : 'Sign Up' }}
          </button>

          <p class="text-center text-sm text-zinc-600">
            Already have an account?
            <a routerLink="/login" class="text-zinc-900 font-semibold hover:underline">Sign in</a>
          </p>
        </form>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;

    try {
      const { email, password, name } = this.form.value;
      await this.authService.signup(email!, password!, name!);
      this.toastService.success('Account created successfully');
      this.router.navigate(['/employee/dashboard']);
    } catch (err) {
      this.toastService.error('Registration failed');
    }
  }
}
