
import { Component, OnInit, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { AuthService, AuthUser } from '../../auth/auth.service';
import { IconComponent } from '../../components/ui/icon.component';
import { LeaveRequestFormComponent } from './modals/leave-request-form.component';
import { SickReportFormComponent } from './modals/sick-report-form.component';
import { ExpenseClaimFormComponent } from './modals/expense-claim-form.component';
import { Attendance, EmployeeHistory, EmployeeSummary, FullEmployeeDetails } from '../../models';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    IconComponent,
    LeaveRequestFormComponent,
    SickReportFormComponent,
    ExpenseClaimFormComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (employee) {
      <div class="min-h-screen w-full bg-zinc-50 flex flex-col overflow-x-hidden relative">
        <!-- Fixed Header -->
        <header class="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-zinc-200 px-6 py-5 z-30 shrink-0">
          <div class="max-w-md mx-auto w-full flex items-center justify-between">
            @switch (activeTab()) {
              @case ('home') {
                <div class="animate-fade-in">
                  <h1 class="text-2xl font-black text-zinc-900 tracking-tight leading-tight">Hi, {{ getFirstName() }}!</h1>
                  <p class="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{{ formatDate() }}</p>
                </div>
              }
              @case ('history') {
                 <h1 class="text-2xl font-black text-zinc-900 tracking-tight animate-fade-in uppercase">History</h1>
              }
              @case ('profile') {
                 <h1 class="text-2xl font-black text-zinc-900 tracking-tight animate-fade-in uppercase">Profile</h1>
              }
            }

            <div class="w-12 h-12 rounded-2xl bg-zinc-900 shadow-lg shadow-zinc-900/20 flex items-center justify-center text-white font-bold text-lg border border-white/10">
               {{ getInitial() }}
            </div>
          </div>
        </header>

      <!-- Scrollable Main Content -->
      <main class="flex-1 overflow-x-hidden pb-32 pt-6 px-6 scroll-smooth w-full">
        <div class="max-w-md mx-auto w-full space-y-6 pb-6">
          @if (dataLoading()) {
            <div class="text-center py-24 text-zinc-400">
              <div class="w-12 h-12 mx-auto border-4 border-zinc-100 border-t-zinc-900 rounded-full animate-spin mb-6"></div>
              <p class="text-xs font-bold uppercase tracking-widest">Loading Dashboard</p>
            </div>
          } @else {
          @switch (activeTab()) {
            @case ('home') {
              <div class="animate-fade-in space-y-6">
                <!-- Location Prompt -->
                @if (locationPermission() === 'prompt') {
                  <div class="bg-zinc-900 rounded-2xl p-5 shadow-2xl animate-scale-in relative overflow-hidden group">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                    <div class="flex items-start gap-4 relative z-10">
                      <div class="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 text-white border border-white/10">
                        <app-icon name="map-pin" [size]="22" />
                      </div>
                      <div class="flex-1">
                        <h4 class="text-sm font-bold text-white mb-1 uppercase tracking-wider">Enable Location</h4>
                        <p class="text-[13px] text-zinc-400 leading-relaxed font-medium">Access is required to verify you are at the office for check-in.</p>
                      </div>
                    </div>
                  </div>
                }

                <div class="grid grid-cols-2 gap-4">
                  <button
                    (click)="handleCheckIn()"
                    [disabled]="loading() || (todayAttendance() && todayAttendance()!.check_in)"
                    class="h-44 rounded-3xl p-5 flex flex-col items-center justify-between shadow-xl transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 relative overflow-hidden group border-2"
                    [class.bg-zinc-900]="!todayAttendance()?.check_in"
                    [class.border-zinc-900]="!todayAttendance()?.check_in"
                    [class.text-white]="!todayAttendance()?.check_in"
                    [class.bg-emerald-50]="todayAttendance()?.check_in"
                    [class.border-emerald-200]="todayAttendance()?.check_in"
                    [class.text-emerald-900]="todayAttendance()?.check_in"
                  >
                    <div class="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12"
                         [class.bg-white/10]="!todayAttendance()?.check_in"
                         [class.bg-emerald-200/50]="todayAttendance()?.check_in">
                      <app-icon name="check-circle" [size]="32" />
                    </div>
                    <div class="text-center w-full">
                      <p class="font-bold text-sm uppercase tracking-widest mb-1">Check In</p>
                      @if (todayAttendance()?.check_in) {
                        <p class="text-2xl font-black">{{ formatTime(todayAttendance()!.check_in) }}</p>
                      } @else {
                        <p class="text-[11px] font-bold opacity-40 uppercase tracking-wider">Start Shift</p>
                      }
                    </div>
                  </button>

                  <button
                    (click)="handleCheckOut()"
                    [disabled]="loading() || !todayAttendance()?.check_in || todayAttendance()?.check_out"
                    class="h-44 rounded-3xl p-5 flex flex-col items-center justify-between border-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 group shadow-sm bg-white"
                    [class.border-zinc-100]="!todayAttendance()?.check_out"
                    [class.bg-rose-50]="todayAttendance()?.check_out"
                    [class.border-rose-200]="todayAttendance()?.check_out"
                    [class.text-rose-900]="todayAttendance()?.check_out"
                  >
                    <div class="w-14 h-14 rounded-2xl flex items-center justify-center bg-zinc-50 transition-transform group-hover:-rotate-12 group-hover:bg-zinc-100"
                         [class.bg-rose-100]="todayAttendance()?.check_out">
                      <app-icon name="x-circle" [size]="32" 
                        [class.text-zinc-400]="!todayAttendance()?.check_out" 
                        [class.text-rose-600]="todayAttendance()?.check_out" 
                      />
                    </div>
                    <div class="text-center w-full">
                      <p class="font-bold text-sm uppercase tracking-widest mb-1 text-zinc-900" [class.text-rose-900]="todayAttendance()?.check_out">Check Out</p>
                       @if (todayAttendance()?.check_out) {
                        <p class="text-2xl font-black">{{ formatTime(todayAttendance()!.check_out) }}</p>
                      } @else {
                         <p class="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">End Shift</p>
                      }
                    </div>
                  </button>
                </div>

                <!-- Summary Cards -->
                @if(summaryData()) {
                  <div class="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100">
                    <div class="grid grid-cols-3 gap-6">
                      <div class="text-center">
                        <p class="text-3xl font-black text-zinc-900 leading-none">{{ summaryData()!.leaveDaysAvailable }}</p>
                        <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2">Leave Bal</p>
                      </div>
                      <div class="text-center border-x border-zinc-50 px-4">
                        <p class="text-3xl font-black text-zinc-900 leading-none">{{ summaryData()!.sickDaysTaken }}</p>
                        <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2">Sick Days</p>
                      </div>
                      <div class="text-center">
                        <p class="text-3xl font-black text-zinc-900 leading-none">{{ summaryData()!.pendingClaims }}</p>
                        <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2">Pending</p>
                      </div>
                    </div>
                  </div>
                }
                
                <!-- Quick Actions -->
                <div class="space-y-4">
                   <h3 class="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] px-1">Quick Actions</h3>
                   
                   <div class="grid grid-cols-1 gap-3">
                     <button (click)="showLeaveRequestForm.set(true)" class="w-full bg-white p-5 rounded-2xl flex items-center gap-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-md active:scale-[0.99] transition-all group">
                        <div class="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-900 border border-zinc-100 group-hover:bg-zinc-900 group-hover:text-white transition-all duration-300">
                           <app-icon name="calendar" [size]="20"/>
                        </div>
                        <div class="flex-1 text-left">
                           <p class="font-bold text-sm text-zinc-900 uppercase tracking-wider">Request Leave</p>
                           <p class="text-[12px] font-medium text-zinc-400 mt-0.5">Vacation or personal time off</p>
                        </div>
                        <app-icon name="chevron-right" [size]="18" class="text-zinc-300 group-hover:text-zinc-900 group-hover:translate-x-1 transition-all"/>
                     </button>

                     <button (click)="showSickReportForm.set(true)" class="w-full bg-white p-5 rounded-2xl flex items-center gap-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-md active:scale-[0.99] transition-all group">
                        <div class="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-900 border border-zinc-100 group-hover:bg-zinc-900 group-hover:text-white transition-all duration-300">
                           <app-icon name="heart-pulse" [size]="20"/>
                        </div>
                        <div class="flex-1 text-left">
                           <p class="font-bold text-sm text-zinc-900 uppercase tracking-wider">Report Sick</p>
                           <p class="text-[12px] font-medium text-zinc-400 mt-0.5">Notify admin of your absence</p>
                        </div>
                        <app-icon name="chevron-right" [size]="18" class="text-zinc-300 group-hover:text-zinc-900 group-hover:translate-x-1 transition-all"/>
                     </button>

                     <button (click)="showExpenseClaimForm.set(true)" class="w-full bg-white p-5 rounded-2xl flex items-center gap-5 border border-zinc-100 hover:border-zinc-200 hover:shadow-md active:scale-[0.99] transition-all group">
                        <div class="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-900 border border-zinc-100 group-hover:bg-zinc-900 group-hover:text-white transition-all duration-300">
                           <app-icon name="receipt" [size]="20"/>
                        </div>
                        <div class="flex-1 text-left">
                           <p class="font-bold text-sm text-zinc-900 uppercase tracking-wider">Expense Claim</p>
                           <p class="text-[12px] font-medium text-zinc-400 mt-0.5">Submit receipts for reimbursement</p>
                        </div>
                        <app-icon name="chevron-right" [size]="18" class="text-zinc-300 group-hover:text-zinc-900 group-hover:translate-x-1 transition-all"/>
                     </button>
                   </div>
                </div>
              </div>
            }

            @case ('history') {
              <div class="animate-fade-in space-y-4">
                 @for (record of history(); track $index) {
                   <div class="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm relative overflow-hidden group hover:border-zinc-200 transition-all">
                      <div class="flex justify-between items-center mb-4">
                         <div class="flex flex-col">
                            <span class="text-xs font-black text-zinc-400 uppercase tracking-widest leading-none">{{ getDayName(record.date) }}</span>
                            <span class="text-lg font-black text-zinc-900 mt-1 leading-none">{{ record.date }}</span>
                         </div>
                         <div class="px-3 py-1 bg-zinc-50 rounded-lg border border-zinc-100">
                            <span class="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{{ record.hours || '0' }} HRS</span>
                         </div>
                      </div>
                      <div class="grid grid-cols-2 gap-4">
                         <div class="bg-zinc-50/50 p-3 rounded-xl border border-dotted border-zinc-200">
                            <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                               <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> In
                            </p>
                            <p class="font-black text-zinc-900 text-base tabular-nums">{{ formatTime(record.check_in) || '--:--' }}</p>
                         </div>
                         <div class="bg-zinc-50/50 p-3 rounded-xl border border-dotted border-zinc-200">
                            <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                               <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Out
                            </p>
                            <p class="font-black text-zinc-900 text-base tabular-nums">{{ formatTime(record.check_out) || '--:--' }}</p>
                         </div>
                      </div>
                   </div>
                 } @empty {
                   <div class="flex flex-col items-center justify-center py-24 text-zinc-400">
                      <div class="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center mb-6 border border-zinc-100">
                        <app-icon name="calendar" [size]="32" class="text-zinc-200"/>
                      </div>
                      <p class="text-xs font-bold uppercase tracking-widest">No activity found</p>
                   </div>
                 }
              </div>
            }

            @case ('profile') {
              <div class="animate-fade-in space-y-6 pb-20">
                 <!-- Top Card -->
                 <div class="bg-white rounded-[2.5rem] p-8 border border-zinc-100 shadow-sm text-center relative overflow-hidden group">
                    <div class="absolute top-0 left-0 w-full h-32 bg-zinc-900 opacity-[0.03]"></div>
                    <div class="relative z-10">
                      <div class="w-28 h-28 mx-auto bg-zinc-900 rounded-[2.5rem] flex items-center justify-center text-4xl font-black text-white mb-6 shadow-2xl shadow-zinc-900/30 border-4 border-white">
                        {{ getInitial() }}
                      </div>
                      <h2 class="text-3xl font-black text-zinc-900 tracking-tight leading-none mb-3">{{ employee?.name }}</h2>
                      <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-100 rounded-full mb-4">
                        <span class="w-2 h-2 rounded-full bg-zinc-900 animate-pulse"></span>
                        <span class="text-[11px] font-black text-zinc-900 uppercase tracking-[0.2em]">{{ employee?.job_title || employee?.role }}</span>
                      </div>
                    </div>
                 </div>

                 <!-- Detailed Sections -->
                 <div class="space-y-4">
                    <!-- Professional Section -->
                    <div class="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm">
                       <h3 class="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                          <app-icon name="briefcase" size="14"/> Professional
                       </h3>
                       <div class="space-y-5">
                          <div class="flex justify-between items-end border-b border-zinc-50 pb-4">
                             <div class="space-y-1">
                                <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Employee ID</p>
                                <p class="text-sm font-black text-zinc-900 tabular-nums">#{{ employee?.id?.slice(-8).toUpperCase() }}</p>
                             </div>
                             <div class="text-right space-y-1">
                                <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Type</p>
                                <p class="text-sm font-black text-zinc-900 uppercase">{{ fullDetails()?.employment_type?.replace('_', ' ') || 'Full Time' }}</p>
                             </div>
                          </div>
                          <div class="flex justify-between items-end">
                             <div class="space-y-1">
                                <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Joined Date</p>
                                <p class="text-sm font-black text-zinc-900">{{ fullDetails()?.start_date || '-- / -- / --' }}</p>
                             </div>
                             <div class="text-right space-y-1">
                                <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</p>
                                <p class="text-sm font-black text-emerald-600 uppercase tracking-widest">Active</p>
                             </div>
                          </div>
                       </div>
                    </div>

                    <!-- Personal Section -->
                    <div class="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm">
                       <h3 class="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                          <app-icon name="user" size="14"/> Personal Details
                       </h3>
                       <div class="space-y-6">
                          <div class="grid grid-cols-2 gap-4">
                             <div class="space-y-1">
                                <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Phone</p>
                                <p class="text-sm font-black text-zinc-900">{{ fullDetails()?.phone_number || 'Not Set' }}</p>
                             </div>
                             <div class="space-y-1">
                                <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Birth Date</p>
                                <p class="text-sm font-black text-zinc-900">{{ fullDetails()?.date_of_birth || '-- / -- / --' }}</p>
                             </div>
                          </div>
                          <div class="space-y-1 border-t border-zinc-50 pt-4">
                             <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Email Address</p>
                             <p class="text-sm font-black text-zinc-900">{{ employee?.email }}</p>
                          </div>
                          <div class="space-y-1 border-t border-zinc-50 pt-4">
                             <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Mailing Address</p>
                             <p class="text-sm font-bold text-zinc-600 leading-relaxed">{{ fullDetails()?.address || 'No address provided' }}</p>
                          </div>
                       </div>
                    </div>

                    <!-- Security / Legal Section -->
                    <div class="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm">
                       <h3 class="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                          <app-icon name="shield-check" size="14"/> Legal & Finance
                       </h3>
                       <div class="space-y-6">
                          <div class="space-y-1">
                             <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">National ID (KTP)</p>
                             <p class="text-sm font-black text-zinc-900 tabular-nums">{{ fullDetails()?.national_id || '•••• •••• •••• ••••' }}</p>
                          </div>
                          <div class="flex justify-between items-center border-t border-zinc-50 pt-4">
                             <div class="space-y-1">
                                <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Bank</p>
                                <p class="text-sm font-black text-zinc-900 uppercase">{{ fullDetails()?.bank_name || 'Not Linked' }}</p>
                             </div>
                             <div class="text-right space-y-1">
                                <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Account Number</p>
                                <p class="text-sm font-black text-zinc-900 tabular-nums">{{ fullDetails()?.bank_account_number || '••••••••••' }}</p>
                             </div>
                          </div>
                       </div>
                    </div>

                    <!-- Emergency Contact -->
                    <div class="bg-rose-50/50 rounded-3xl p-6 border border-rose-100 shadow-sm">
                       <h3 class="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                          <app-icon name="heart-handshake" size="14"/> Emergency Contact
                       </h3>
                       <div class="space-y-1">
                          <p class="text-sm font-black text-rose-900">{{ fullDetails()?.emergency_contact_name || 'Not Provided' }}</p>
                          <p class="text-xs font-bold text-rose-600 mt-1">{{ fullDetails()?.emergency_contact_phone || '' }}</p>
                       </div>
                    </div>
                 </div>

                 <!-- Logout Section -->
                 <div class="pt-6">
                   <button (click)="handleLogout()" class="w-full bg-white p-6 rounded-[2rem] flex items-center justify-center gap-3 text-rose-600 font-black uppercase tracking-[0.2em] text-xs border-2 border-rose-50 hover:bg-rose-50 active:scale-[0.98] transition-all shadow-sm">
                      <app-icon name="log-out" [size]="18"/>
                      Sign Out From Session
                   </button>
                   <p class="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-6">Version 2.0.4-premium</p>
                 </div>
              </div>
            }
          }
          }
        </div>
      </main>

        <!-- Bottom Navigation -->
        <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 z-50 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          <div class="flex h-16 max-w-md mx-auto">
            
            <!-- Home Tab -->
            <button 
              type="button" 
              (click)="activeTab.set('home')" 
              class="flex-1 flex flex-col items-center justify-center gap-1 transition-all"
              [class.text-zinc-900]="activeTab() === 'home'"
              [class.text-zinc-400]="activeTab() !== 'home'"
            >
              <div 
                class="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                [class.bg-zinc-900]="activeTab() === 'home'"
                [class.text-white]="activeTab() === 'home'"
              >
                <app-icon name="layout-dashboard" [size]="20"/>
              </div>
              <span class="text-[10px] font-bold tracking-tight">HOME</span>
            </button>

            <!-- History Tab -->
            <button 
              type="button" 
              (click)="activeTab.set('history')" 
              class="flex-1 flex flex-col items-center justify-center gap-1 transition-all"
              [class.text-zinc-900]="activeTab() === 'history'"
              [class.text-zinc-400]="activeTab() !== 'history'"
            >
              <div 
                class="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                [class.bg-zinc-900]="activeTab() === 'history'"
                [class.text-white]="activeTab() === 'history'"
              >
                <app-icon name="clock" [size]="20"/>
              </div>
              <span class="text-[10px] font-bold tracking-tight">HISTORY</span>
            </button>

            <!-- Profile Tab -->
            <button 
              type="button" 
              (click)="activeTab.set('profile')" 
              class="flex-1 flex flex-col items-center justify-center gap-1 transition-all"
              [class.text-zinc-900]="activeTab() === 'profile'"
              [class.text-zinc-400]="activeTab() !== 'profile'"
            >
              <div 
                class="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                [class.bg-zinc-900]="activeTab() === 'profile'"
                [class.text-white]="activeTab() === 'profile'"
              >
                <app-icon name="user" [size]="20"/>
              </div>
              <span class="text-[10px] font-bold tracking-tight">PROFILE</span>
            </button>

          </div>
        </nav>
      </div>

      <!-- Modals -->
      @if(showLeaveRequestForm()) {
        <app-leave-request-form 
          [employeeId]="employee?.id" 
          (close)="showLeaveRequestForm.set(false)"
          (submitRequest)="handleLeaveRequest($event)"
        />
      }
      @if(showSickReportForm()) {
        <app-sick-report-form
          [employeeId]="employee?.id" 
          (close)="showSickReportForm.set(false)"
          (submitRequest)="handleSickReport($event)"
        />
      }
      @if(showExpenseClaimForm()) {
        <app-expense-claim-form
          [employeeId]="employee?.id" 
          (close)="showExpenseClaimForm.set(false)"
          (submitRequest)="handleExpenseClaim($event)"
        />
      }
    }
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `]
})
export class EmployeeDashboardComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // Office location configuration - in production, this should come from a config service
  private readonly OFFICE_LAT = 0.5031383484339234;
  private readonly OFFICE_LON = 101.43880598650681;
  private readonly MAX_DISTANCE_METERS = 100;

  employee: AuthUser | null = this.authService.currentUser();
  activeTab = signal<'home' | 'history' | 'profile'>('home');

  todayAttendance = signal<Attendance | null>(null);
  history = signal<Attendance[]>([]);
  fullDetails = signal<FullEmployeeDetails | null>(null);
  loading = signal(false);
  dataLoading = signal(true);
  locationPermission = signal<string | null>(null);
  summaryData = signal<EmployeeSummary | null>(null);

  showLeaveRequestForm = signal(false);
  showSickReportForm = signal(false);
  showExpenseClaimForm = signal(false);

  ngOnInit(): void {
    if (!this.employee) {
      this.router.navigateByUrl('/');
      return;
    }
    this.checkLocationPermission();
    this.loadData();
  }

  getFirstName(): string {
    return this.employee?.name?.split(' ')[0] || 'User';
  }

  getInitial(): string {
    return this.employee?.name?.charAt(0).toUpperCase() || 'U';
  }

  async checkLocationPermission(): Promise<void> {
    if (!navigator.geolocation) return;
    try {
      if (navigator.permissions) {
        const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        this.locationPermission.set(result.state);
        result.onchange = () => this.locationPermission.set(result.state);
      }
      navigator.geolocation.getCurrentPosition(
        () => this.locationPermission.set('granted'),
        (err) => console.log('Location permission error:', err)
      );
    } catch (e) {
      console.log('Location permission check failed:', e);
    }
  }

  loadData(): void {
    if (!this.employee?.id) return;
    this.dataLoading.set(true);

    // Fetch Full Details
    this.api.getFullEmployeeDetails(this.employee.id).subscribe(details => {
      this.fullDetails.set(details);
    });

    this.api.getEmployeeHistory(this.employee.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data: EmployeeHistory) => {
        const today = new Date().toLocaleDateString('en-CA');
        const todayRecord = data.attendance.find((att) => att.date === today);
        this.todayAttendance.set(todayRecord || null);
        this.summaryData.set(data.summary || null);
        this.history.set([...data.attendance].reverse());
        this.dataLoading.set(false);
      },
      error: () => {
        this.toast.error('Unable to load your dashboard data.');
        this.todayAttendance.set(null);
        this.summaryData.set(null);
        this.history.set([]);
        this.dataLoading.set(false);
      }
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  handleCheckIn(): void {
    if (!this.employee?.id) return;

    this.loading.set(true);
    if (!navigator.geolocation) {
      this.toast.error('Geolocation is not supported by your browser.');
      this.loading.set(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const distance = this.calculateDistance(latitude, longitude, this.OFFICE_LAT, this.OFFICE_LON);

        if (distance > this.MAX_DISTANCE_METERS) {
          this.toast.error(`You are too far from the office to check in (${distance.toFixed(0)}m away).`);
          this.loading.set(false);
          return;
        }

        this.api.checkIn({ employeeId: this.employee!.id!, latitude, longitude }).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe({
          next: (res) => {
            if (res.success) {
              this.toast.success('Checked in successfully!');
              this.loadData();
            } else {
              this.toast.error(res.error || 'Check-in failed.');
            }
            this.loading.set(false);
          },
          error: () => {
            this.toast.error('Check-in failed. Please try again.');
            this.loading.set(false);
          }
        });
      },
      () => {
        this.toast.error('Could not get location. Please enable location services.');
        this.loading.set(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  handleCheckOut(): void {
    if (!this.employee?.id) return;

    this.loading.set(true);
    this.api.checkOut({ employeeId: this.employee.id }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success(`Checked out! Hours: ${res.hours || 'N/A'}`);
          this.loadData();
        } else {
          this.toast.error(res.error || 'Check-out failed.');
        }
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Check-out failed. Please try again.');
        this.loading.set(false);
      }
    });
  }

  handleLeaveRequest(data: { employeeId: string; fromDate: string; toDate: string; reason: string }): void {
    this.api.submitLeaveRequest(data).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success('Leave request submitted successfully!');
          this.showLeaveRequestForm.set(false);
        } else {
          this.toast.error(res.error || 'Unable to submit leave request.');
        }
      },
      error: () => {
        this.toast.error('Unable to submit leave request.');
      }
    });
  }

  handleSickReport(data: { employeeId: string; date: string; notes?: string }): void {
    this.api.submitSickReport(data).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success('Sick report submitted successfully!');
          this.showSickReportForm.set(false);
        } else {
          this.toast.error(res.error || 'Unable to submit sick report.');
        }
      },
      error: () => {
        this.toast.error('Unable to submit sick report.');
      }
    });
  }

  handleExpenseClaim(data: { employeeId: string; amount: number; description: string; date?: string }): void {
    this.api.submitExpenseClaim(data).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success('Expense claim submitted successfully!');
          this.showExpenseClaimForm.set(false);
        } else {
          this.toast.error(res.error || 'Unable to submit expense claim.');
        }
      },
      error: () => {
        this.toast.error('Unable to submit expense claim.');
      }
    });
  }

  handleLogout(): void {
    this.authService.logout();
    this.toast.success('Logged out successfully');
  }

  formatTime(iso: string | null): string {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  }

  formatDate(): string {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  getDayName(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
    } catch {
      return '';
    }
  }
}
