
import { Component, input, output, signal, OnInit, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../components/ui/icon.component';
import { ToastService } from '../../../services/toast.service';
import { FullEmployeeDetails } from '../../../models';

@Component({
   selector: 'app-add-edit-employee-form',
   standalone: true,
   imports: [FormsModule, CommonModule, IconComponent],
   changeDetection: ChangeDetectionStrategy.OnPush,
   template: `
    <!-- Full-Screen In-App Page Overlay -->
    <div 
      class="fixed inset-0 z-[9999] bg-zinc-50 flex flex-col animate-fade-in"
      aria-labelledby="page-title" 
      role="dialog" 
      aria-modal="true"
    >
      <!-- Header -->
      <div class="bg-white border-b border-zinc-200 px-4 py-4 sm:px-6 shrink-0 shadow-sm z-10">
        <div class="max-w-3xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-3">
             <button 
              type="button" 
              (click)="close.emit()"
              class="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-all"
             >
                <app-icon name="arrow-left" size="24"/>
             </button>
             <div>
               <h1 id="page-title" class="text-xl font-bold text-zinc-900 tracking-tight">
                 {{ isEditMode() ? 'Edit Profile' : 'New Employee' }}
               </h1>
             </div>
          </div>
          
          <div class="flex gap-2">
             <button 
                type="button" 
                (click)="close.emit()" 
                class="hidden sm:block px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg transition-all"
             >
                Cancel
             </button>
             <button 
                type="button" 
                (click)="onSubmit(employeeForm)"
                [disabled]="loading()"
                class="px-5 py-2 bg-zinc-900 text-white text-sm font-semibold rounded-lg hover:bg-zinc-800 active:scale-95 transition-all flex items-center gap-2"
             >
                @if (loading()) {
                   <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                }
                {{ loading() ? 'Saving...' : 'Save' }}
             </button>
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="flex-1 overflow-y-auto custom-scrollbar">
        <div class="max-w-3xl mx-auto p-4 sm:p-8 space-y-8 pb-20 sm:pb-32">
           
           <form #employeeForm="ngForm" class="space-y-8">
              
              <!-- 1. Identity & Personal -->
              <section class="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-zinc-100">
                 <div class="flex items-center gap-3 mb-6">
                    <div class="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-900">
                       <app-icon name="user" size="20"/>
                    </div>
                    <h3 class="text-lg font-bold text-zinc-900">Personal Information</h3>
                 </div>
                 
                 <div class="grid md:grid-cols-2 gap-6">
                    <div class="md:col-span-2">
                      <label class="block text-sm font-bold text-zinc-700 mb-2">Display Name</label>
                      <input type="text" [(ngModel)]="formData.name" name="name" required
                        class="w-full px-4 py-3 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:ring-2 focus:ring-zinc-900 transition-all font-medium text-zinc-900 placeholder-zinc-400"
                        placeholder="e.g. Sarah Connor"
                      />
                    </div>

                    <div>
                      <label class="block text-sm font-bold text-zinc-700 mb-2">Email Address</label>
                      <input type="email" [(ngModel)]="formData.email" name="email" required email [readonly]="isEditMode()"
                        class="w-full px-4 py-3 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:ring-2 focus:ring-zinc-900 transition-all font-medium text-zinc-900 placeholder-zinc-400"
                        placeholder="sarah@company.com"
                        [class.opacity-50]="isEditMode()"
                      />
                    </div>

                    @if (!isEditMode()) {
                      <div class="md:col-span-2">
                        <label class="block text-sm font-bold text-zinc-700 mb-2">Login PIN / Password</label>
                        <input type="text" [(ngModel)]="formData.pin" name="pin" required minlength="6"
                          class="w-full px-4 py-3 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:ring-2 focus:ring-zinc-900 transition-all font-medium text-zinc-900 placeholder-zinc-400 font-mono tracking-wider"
                          placeholder="e.g. 123456"
                        />
                        <p class="text-xs text-zinc-500 mt-1">Minimum 6 characters. They will use this to log in.</p>
                      </div>
                    }

                    
                    <div>
                      <label class="block text-sm font-bold text-zinc-700 mb-2">Phone Number</label>
                      <input type="tel" [(ngModel)]="formData.phone_number" name="phone_number"
                        class="w-full px-4 py-3 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:ring-2 focus:ring-zinc-900 transition-all font-medium text-zinc-900 placeholder-zinc-400"
                        placeholder="+62 812..."
                      />
                    </div>

                    <div>
                       <label class="block text-sm font-bold text-zinc-700 mb-2">Date of Birth</label>
                       <input type="date" [(ngModel)]="formData.date_of_birth" name="date_of_birth"
                          class="w-full px-4 py-3 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:ring-2 focus:ring-zinc-900 transition-all font-medium text-zinc-900 appearance-none"
                       />
                    </div>

                    <div>
                       <label class="block text-sm font-bold text-zinc-700 mb-2">Gender</label>
                       <div class="relative">
                          <select [(ngModel)]="formData.gender" name="gender" class="w-full px-4 py-3 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:ring-2 focus:ring-zinc-900 transition-all font-medium text-zinc-900 appearance-none">
                             <option [ngValue]="undefined">Select Gender</option>
                             <option value="male">Male</option>
                             <option value="female">Female</option>
                          </select>
                          <app-icon name="chevrons-up-down" size="16" class="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"/>
                       </div>
                    </div>
                    
                    <div class="md:col-span-2">
                      <label class="block text-sm font-bold text-zinc-700 mb-2">National ID / KTP</label>
                      <input type="text" [(ngModel)]="formData.national_id" name="national_id"
                        class="w-full px-4 py-3 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:ring-2 focus:ring-zinc-900 transition-all font-medium text-zinc-900 placeholder-zinc-400"
                        placeholder="16-digit ID number"
                      />
                    </div>
                 </div>
              </section>
              
              <!-- 2. Address & Emergency -->
              <section class="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-zinc-100">
                 <div class="flex items-center gap-3 mb-6">
                    <div class="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-900">
                       <app-icon name="map-pin" size="20"/>
                    </div>
                    <h3 class="text-lg font-bold text-zinc-900">Address & Emergency</h3>
                 </div>

                 <div class="grid md:grid-cols-2 gap-6">
                    <div class="md:col-span-2">
                       <label class="block text-sm font-bold text-zinc-700 mb-2">Full Address</label>
                       <textarea [(ngModel)]="formData.address" name="address" rows="3"
                          class="w-full px-4 py-3 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:ring-2 focus:ring-zinc-900 transition-all font-medium text-zinc-900 placeholder-zinc-400 resize-none"
                          placeholder="Street, City, Postal Code..."
                       ></textarea>
                    </div>

                    <div>
                      <label class="block text-sm font-bold text-zinc-700 mb-2">Emergency Contact Name</label>
                      <input type="text" [(ngModel)]="formData.emergency_contact_name" name="emergency_contact_name"
                        class="w-full px-4 py-3 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:ring-2 focus:ring-zinc-900 transition-all font-medium text-zinc-900 placeholder-zinc-400"
                        placeholder="Family member or friend"
                      />
                    </div>

                    <div>
                      <label class="block text-sm font-bold text-zinc-700 mb-2">Emergency Phone</label>
                      <input type="tel" [(ngModel)]="formData.emergency_contact_phone" name="emergency_contact_phone"
                        class="w-full px-4 py-3 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:ring-2 focus:ring-zinc-900 transition-all font-medium text-zinc-900 placeholder-zinc-400"
                        placeholder="+62..."
                      />
                    </div>
                 </div>
              </section>

              <!-- 3. Professional Details -->
              <section class="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-zinc-100">
                 <div class="flex items-center gap-3 mb-6">
                    <div class="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-900">
                       <app-icon name="briefcase" size="20"/>
                    </div>
                    <h3 class="text-lg font-bold text-zinc-900">Role & Status</h3>
                 </div>

                 <div class="grid md:grid-cols-2 gap-6">
                    <div>
                       <label class="block text-sm font-bold text-zinc-700 mb-2">Job Title</label>
                       <div class="relative">
                          <select [(ngModel)]="formData.job_title" name="job_title" class="w-full px-4 py-3 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:ring-2 focus:ring-zinc-900 transition-all font-medium text-zinc-900 appearance-none">
                             <option value="commis_kitchen">Commis Kitchen</option>
                             <option value="barista">Barista</option>
                             <option value="steward">Steward</option>
                             <option value="commis_pastry">Commis Pastry</option>
                             <option value="fnb_service">F&B Service</option>
                             <option value="manager">Manager</option>
                          </select>
                          <app-icon name="chevrons-up-down" size="16" class="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"/>
                       </div>
                    </div>

                    <div>
                       <label class="block text-sm font-bold text-zinc-700 mb-2">Employment Type</label>
                       <div class="relative">
                          <select [(ngModel)]="formData.employment_type" name="employment_type" class="w-full px-4 py-3 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:ring-2 focus:ring-zinc-900 transition-all font-medium text-zinc-900 appearance-none">
                             <option value="full_time">Full Time</option>
                             <option value="part_time">Part Time</option>
                          </select>
                          <app-icon name="chevrons-up-down" size="16" class="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"/>
                       </div>
                    </div>
                    
                    <div>
                       <label class="block text-sm font-bold text-zinc-700 mb-2">Start Date</label>
                       <input type="date" [(ngModel)]="formData.start_date" name="start_date"
                          class="w-full px-4 py-3 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:ring-2 focus:ring-zinc-900 transition-all font-medium text-zinc-900 appearance-none"
                       />
                    </div>

                    <div>
                       <label class="block text-sm font-bold text-zinc-700 mb-2">Probation End Date</label>
                       <input type="date" [(ngModel)]="formData.probation_end_date" name="probation_end_date"
                          class="w-full px-4 py-3 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:ring-2 focus:ring-zinc-900 transition-all font-medium text-zinc-900 appearance-none"
                       />
                    </div>

                    <div class="md:col-span-2">
                       <label class="block text-sm font-bold text-zinc-700 mb-2">Account Status</label>
                       <div class="flex p-1 bg-zinc-100 rounded-xl">
                          <button type="button" (click)="formData.status = 'active'" class="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all"
                             [class.bg-white]="formData.status === 'active'"
                             [class.shadow-sm]="formData.status === 'active'"
                             [class.text-zinc-900]="formData.status === 'active'"
                             [class.text-zinc-500]="formData.status !== 'active'"
                          >Active</button>
                          <button type="button" (click)="formData.status = 'inactive'" class="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all"
                             [class.bg-white]="formData.status === 'inactive'"
                             [class.shadow-sm]="formData.status === 'inactive'"
                             [class.text-rose-600]="formData.status === 'inactive'"
                             [class.text-zinc-500]="formData.status !== 'inactive'"
                          >Inactive</button>
                       </div>
                    </div>
                 </div>
              </section>

              <!-- 4. Compensation -->
               <section class="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-zinc-100">
                 <div class="flex items-center gap-3 mb-6">
                    <div class="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-900">
                       <app-icon name="credit-card" size="20"/>
                    </div>
                    <h3 class="text-lg font-bold text-zinc-900">Compensation</h3>
                 </div>

                 <div class="grid md:grid-cols-2 gap-6">
                    <div>
                       <label class="block text-sm font-bold text-zinc-700 mb-2">Bank Name</label>
                       <div class="relative">
                          <select [(ngModel)]="formData.bank_name" name="bank_name" class="w-full px-4 py-3 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:ring-2 focus:ring-zinc-900 transition-all font-medium text-zinc-900 appearance-none">
                              <option [ngValue]="undefined">Select Bank</option>
                              <option value="bca">BCA</option>
                              <option value="mandiri">Mandiri</option>
                              <option value="bri">BRI</option>
                              <option value="bni">BNI</option>
                              <option value="cimb">CIMB Niaga</option>
                              <option value="jago">Jago</option>
                          </select>
                           <app-icon name="chevrons-up-down" size="16" class="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"/>
                       </div>
                    </div>

                    <div>
                       <label class="block text-sm font-bold text-zinc-700 mb-2">Account Number</label>
                       <input type="text" [(ngModel)]="formData.bank_account_number" name="bank_account_number"
                        class="w-full px-4 py-3 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:ring-2 focus:ring-zinc-900 transition-all font-medium text-zinc-900 placeholder-zinc-400"
                        placeholder="000-000-000"
                      />
                    </div>
                    
                    <div class="md:col-span-2">
                       <label class="block text-sm font-bold text-zinc-700 mb-2">
                         {{ formData.employment_type === 'full_time' ? 'Monthly Salary' : 'Hourly Rate' }}
                       </label>
                       <div class="relative">
                          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">Rp</span>
                           @if (formData.employment_type === 'full_time') {
                            <input type="number" 
                               [(ngModel)]="formData.monthly_salary_idr" 
                               name="monthly_salary_idr"
                               class="w-full pl-12 pr-4 py-3 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:ring-2 focus:ring-zinc-900 transition-all font-mono font-bold text-zinc-900 text-lg"
                               placeholder="0"
                            />
                          } @else {
                            <input type="number" 
                               [(ngModel)]="formData.hourly_rate_idr" 
                               name="hourly_rate_idr"
                               class="w-full pl-12 pr-4 py-3 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:ring-2 focus:ring-zinc-900 transition-all font-mono font-bold text-zinc-900 text-lg"
                               placeholder="0"
                            />
                          }
                       </div>
                    </div>
                 </div>
              </section>

               <!-- Mobile Save Button (In-Flow) -->
               <div class="sm:hidden pt-4">
                  <button 
                     type="button" 
                     (click)="onSubmit(employeeForm)"
                     [disabled]="loading()"
                     class="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold shadow-xl shadow-zinc-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                     @if (loading()) {
                        <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                     }
                     {{ loading() ? 'Saving Changes...' : 'Save Employee' }}
                  </button>
               </div>
            </form>
         </div>
      </div>

    </div>
  `,
   styles: [`
    @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
  `]
})
export class AddEditEmployeeFormComponent implements OnInit {
   private toast = inject(ToastService);

   employeeData = input<FullEmployeeDetails | null>(null);
   close = output<void>();
   save = output<FullEmployeeDetails>();

   isEditMode = computed(() => !!this.employeeData());

   loading = signal(false);
   formSubmitted = signal(false);

   formData = {
      name: '',
      email: '',
      job_title: 'commis_kitchen',
      employment_type: 'full_time',
      status: 'active',
      bank_name: undefined as string | undefined,
      bank_account_number: '',
      monthly_salary_idr: 0,
      hourly_rate_idr: 0,

      // New Fields
      phone_number: '',
      date_of_birth: '',
      gender: undefined as 'male' | 'female' | 'other' | undefined,
      national_id: '',
      address: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      start_date: '',
      probation_end_date: '',
      pin: ''
   };

   ngOnInit(): void {
      if (this.employeeData()) {
         const data = this.employeeData()!;
         this.formData = {
            name: data.name,
            email: data.email,
            job_title: data.job_title,
            employment_type: data.employment_type,
            status: data.status,
            bank_name: data.bank_name,
            bank_account_number: data.bank_account_number || '',
            monthly_salary_idr: data.monthly_salary_idr || 0,
            hourly_rate_idr: data.hourly_rate_idr || 0,

            // Map new fields (with fallbacks if undefined)
            phone_number: data.phone_number || '',
            date_of_birth: data.date_of_birth || '',
            gender: data.gender as any,
            national_id: data.national_id || '',
            address: data.address || '',
            emergency_contact_name: data.emergency_contact_name || '',
            emergency_contact_phone: data.emergency_contact_phone || '',
            start_date: data.start_date || '',
            probation_end_date: data.probation_end_date || '',
            pin: '' // No PIN edit support
         };
      } else {
         this.resetForm();
      }
   }

   onSubmit(form: NgForm): void {
      this.formSubmitted.set(true);

      if (form.invalid) {
         this.toast.error('Please fill in all required fields.');
         return;
      }

      // Validate salary based on employment type
      if (this.formData.employment_type === 'full_time' && (!this.formData.monthly_salary_idr || this.formData.monthly_salary_idr <= 0)) {
         this.toast.error('Monthly salary is required for full-time employees.');
         return;
      }
      if (this.formData.employment_type === 'part_time' && (!this.formData.hourly_rate_idr || this.formData.hourly_rate_idr <= 0)) {
         this.toast.error('Hourly rate is required for part-time employees.');
         return;
      }

      this.loading.set(true);
      const finalData = { ...this.formData };
      if (finalData.employment_type === 'full_time') {
         finalData.hourly_rate_idr = 0;
      } else {
         finalData.monthly_salary_idr = 0;
      }

      // Cast to any to bypass strict type check for now if FullEmployeeDetails isn't fully propagated in IDE cache
      this.save.emit(finalData as any);
   }

   onBackdropClick(event: MouseEvent): void { }

   resetForm(): void {
      this.formData = {
         name: '',
         email: '',
         job_title: 'commis_kitchen',
         employment_type: 'full_time',
         status: 'active',
         bank_name: undefined,
         bank_account_number: '',
         monthly_salary_idr: 0,
         hourly_rate_idr: 0,

         phone_number: '',
         date_of_birth: '',
         gender: undefined,
         national_id: '',
         address: '',
         emergency_contact_name: '',
         emergency_contact_phone: '',
         start_date: '',
         probation_end_date: '',
         pin: ''
      };
      this.formSubmitted.set(false);
   }
}
