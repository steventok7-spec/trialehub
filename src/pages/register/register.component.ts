
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { IconComponent } from '../../components/ui/icon.component';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 flex flex-col items-center justify-center p-5 py-12 relative">
      
      <div class="w-full max-w-xl">
        <!-- Logo & Branding -->
        <div class="text-center mb-10">
          <h1 class="text-4xl font-bold text-zinc-900 tracking-tight">SUKHA</h1>
          <p class="text-sm text-zinc-500 mt-2">Join the Management Hub</p>
        </div>

        <!-- Registration Form Card -->
        <div class="bg-white rounded-2xl shadow-xl shadow-zinc-200/50 p-6 sm:p-10 border border-zinc-100">
          <div class="flex items-center gap-3 mb-8">
            <button routerLink="/" class="p-2 -ml-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded-full transition-all">
              <app-icon name="arrow-left" size="20" />
            </button>
            <h2 class="text-2xl font-bold text-zinc-900">Create Account</h2>
          </div>
          
          <form #regForm="ngForm" (submit)="handleRegister(regForm)" class="space-y-6">
            
            <div class="grid sm:grid-cols-2 gap-6">
              <!-- Full Name -->
              <div class="sm:col-span-2">
                <label class="block text-sm font-semibold text-zinc-700 mb-2">Full Name</label>
                <input
                  type="text"
                  [(ngModel)]="formData.name"
                  name="name"
                  required
                  minlength="3"
                  #nameModel="ngModel"
                  placeholder="Enter your full name"
                  class="w-full px-4 py-3.5 border border-zinc-200 bg-zinc-50 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent focus:bg-white transition-all text-base"
                  [class.border-red-500]="nameModel.invalid && nameModel.touched"
                />
                @if (nameModel.invalid && nameModel.touched) {
                  <p class="text-xs text-red-500 mt-1">Full name is required (min 3 characters).</p>
                }
              </div>

              <!-- Email -->
              <div class="sm:col-span-2">
                <label class="block text-sm font-semibold text-zinc-700 mb-2">Email Address</label>
                <input
                  type="email"
                  [(ngModel)]="formData.email"
                  name="email"
                  required
                  email
                  #emailModel="ngModel"
                  placeholder="e.g. employee@company.com"
                  class="w-full px-4 py-3.5 border border-zinc-200 bg-zinc-50 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent focus:bg-white transition-all text-base"
                  [class.border-red-500]="emailModel.invalid && emailModel.touched"
                />
                @if (emailModel.invalid && emailModel.touched) {
                  <p class="text-xs text-red-500 mt-1">Please enter a valid email address.</p>
                }
              </div>

              <!-- Password -->
              <div class="sm:col-span-2">
                <label class="block text-sm font-semibold text-zinc-700 mb-2">Create Password</label>
                <div class="relative">
                  <input
                    [type]="showPassword() ? 'text' : 'password'"
                    [(ngModel)]="formData.password"
                    name="password"
                    required
                    minlength="8"
                    #passwordModel="ngModel"
                    placeholder="Minimum 8 characters"
                    class="w-full px-4 py-3.5 pr-12 border border-zinc-200 bg-zinc-50 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent focus:bg-white transition-all text-base"
                    [class.border-red-500]="passwordModel.invalid && passwordModel.touched"
                  />
                  <button 
                    type="button"
                    (click)="showPassword.set(!showPassword())"
                    class="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                  >
                    <app-icon [name]="showPassword() ? 'eye-off' : 'eye'" size="20" />
                  </button>
                </div>
                @if (passwordModel.invalid && passwordModel.touched) {
                  <p class="text-xs text-red-500 mt-1">Password must be at least 8 characters.</p>
                }
              </div>

              <!-- Phone Number -->
              <div>
                <label class="block text-sm font-semibold text-zinc-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  [(ngModel)]="formData.phone_number"
                  name="phone_number"
                  required
                  pattern="^(08|[+]62)[0-9]{8,13}$"
                  #phoneModel="ngModel"
                  placeholder="08... or +62..."
                  class="w-full px-4 py-3.5 border border-zinc-200 bg-zinc-50 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent focus:bg-white transition-all text-base"
                  [class.border-red-500]="phoneModel.invalid && phoneModel.touched"
                />
                @if (phoneModel.invalid && phoneModel.touched) {
                  <p class="text-xs text-red-500 mt-1">Invalid Indonesian phone format.</p>
                }
              </div>

              <!-- Gender -->
              <div>
                <label class="block text-sm font-semibold text-zinc-700 mb-2">Gender</label>
                <select
                  [(ngModel)]="formData.gender"
                  name="gender"
                  required
                  #genderModel="ngModel"
                  class="w-full px-4 py-3.5 border border-zinc-200 bg-zinc-50 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent focus:bg-white transition-all text-base appearance-none"
                  [class.border-red-500]="genderModel.invalid && genderModel.touched"
                >
                  <option [ngValue]="undefined" disabled>Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
                @if (genderModel.invalid && genderModel.touched) {
                  <p class="text-xs text-red-500 mt-1">Please select gender.</p>
                }
              </div>

              <!-- Date of Birth -->
              <div>
                <label class="block text-sm font-semibold text-zinc-700 mb-2">Date of Birth</label>
                <input
                  type="date"
                  [(ngModel)]="formData.date_of_birth"
                  name="date_of_birth"
                  required
                  #dobModel="ngModel"
                  class="w-full px-4 py-3.5 border border-zinc-200 bg-zinc-50 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent focus:bg-white transition-all text-base"
                  [class.border-red-500]="dobModel.invalid && dobModel.touched"
                />
                @if (dobModel.invalid && dobModel.touched) {
                  <p class="text-xs text-red-500 mt-1">Date of birth is required.</p>
                }
              </div>

              <!-- National ID / KTP -->
              <div>
                <label class="block text-sm font-semibold text-zinc-700 mb-2">National ID / KTP</label>
                <input
                  type="text"
                  [(ngModel)]="formData.national_id"
                  name="national_id"
                  required
                  pattern="^[0-9]{16}$"
                  #ktpModel="ngModel"
                  placeholder="16-digit KTP number"
                  maxlength="16"
                  class="w-full px-4 py-3.5 border border-zinc-200 bg-zinc-50 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent focus:bg-white transition-all text-base"
                  [class.border-red-500]="ktpModel.invalid && ktpModel.touched"
                />
                @if (ktpModel.invalid && ktpModel.touched) {
                  <p class="text-xs text-red-500 mt-1">Must be exactly 16 digits.</p>
                }
              </div>

              <!-- Emergency Contact Section -->
              <div class="sm:col-span-2 pt-4 border-t border-zinc-100">
                <h3 class="text-sm font-bold text-zinc-900 mb-4">Emergency Contact Information</h3>
                <div class="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-semibold text-zinc-700 mb-2">Contact Name</label>
                    <input
                      type="text"
                      [(ngModel)]="formData.emergency_contact_name"
                      name="emergency_contact_name"
                      required
                      minlength="3"
                      #eNameModel="ngModel"
                      placeholder="Contact person's name"
                      class="w-full px-4 py-3.5 border border-zinc-200 bg-zinc-50 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent focus:bg-white transition-all text-base"
                      [class.border-red-500]="eNameModel.invalid && eNameModel.touched"
                    />
                    @if (eNameModel.invalid && eNameModel.touched) {
                      <p class="text-xs text-red-500 mt-1">Min 3 characters required.</p>
                    }
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-zinc-700 mb-2">Contact phone</label>
                    <input
                      type="tel"
                      [(ngModel)]="formData.emergency_contact_phone"
                      name="emergency_contact_phone"
                      required
                      pattern="^(08|[+]62)[0-9]{8,13}$"
                      #ePhoneModel="ngModel"
                      placeholder="08... or +62..."
                      class="w-full px-4 py-3.5 border border-zinc-200 bg-zinc-50 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent focus:bg-white transition-all text-base"
                      [class.border-red-500]="ePhoneModel.invalid && ePhoneModel.touched"
                    />
                    @if (ePhoneModel.invalid && ePhoneModel.touched) {
                      <p class="text-xs text-red-500 mt-1">Invalid Indonesian phone format.</p>
                    }
                  </div>
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="loading() || regForm.invalid"
              class="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-lg shadow-zinc-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 min-h-[56px] mt-4"
            >
              @if (loading()) {
                <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Creating Account...</span>
              } @else {
                <span>Register Account</span>
                <app-icon name="user-plus" class="w-5 h-5" />
              }
            </button>
          </form>

          <!-- Back to Login -->
          <div class="mt-8 text-center">
            <p class="text-sm text-zinc-500">
              Already have an account? 
              <a routerLink="/" class="text-zinc-900 font-bold hover:underline">Sign In</a>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-8 text-center">
          <p class="text-xs text-zinc-400">© 2026 SUKHA. All rights reserved.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    input[type="date"]::-webkit-calendar-picker-indicator {
      filter: invert(0.5);
    }
  `]
})
export class RegisterEmployeeComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private router = inject(Router);

  loading = signal(false);
  showPassword = signal(false);

  formData = {
    name: '',
    email: '',
    password: '',
    phone_number: '',
    gender: undefined as string | undefined,
    date_of_birth: '',
    national_id: '',
    emergency_contact_name: '',
    emergency_contact_phone: ''
  };

  handleRegister(form: NgForm): void {
    if (form.invalid) {
      this.toast.error('Please fill in all required fields correctly.');
      return;
    }

    this.loading.set(true);

    // Construct registration data
    const registrationData = {
      name: this.formData.name,
      email: this.formData.email,
      pin: this.formData.password,
      password: this.formData.password,
      role: 'employee',
      status: 'active',
      job_title: 'fnb_service' as any,
      employment_type: 'full_time' as any,
      salary: 0,
      phone_number: this.formData.phone_number,
      gender: this.formData.gender,
      date_of_birth: this.formData.date_of_birth,
      national_id: this.formData.national_id,
      emergency_contact_name: this.formData.emergency_contact_name,
      emergency_contact_phone: this.formData.emergency_contact_phone
    };

    this.api.addEmployee(registrationData).pipe(
      finalize(() => {
        this.loading.set(false);
      })
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success('Registration successful! You can now log in.');
          this.router.navigate(['/']);
        } else {
          this.toast.error(res.error || 'Registration failed.');
        }
      },
      error: (err) => {
        this.toast.error('An unexpected error occurred during registration.');
        console.error('Registration error:', err);
      }
    });
  }
}
