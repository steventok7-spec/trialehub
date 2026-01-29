import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { EmployeeService } from '../../services/employee.service';
import { Payroll, PayrollAdjustment } from '../../models/payroll.model';
import { HeaderComponent } from '../../components/layout/header.component';
import { CardComponent } from '../../components/ui/card.component';
import { LoadingSpinnerComponent } from '../../components/ui/loading-spinner.component';
import { IconComponent } from '../../components/ui/icon.component';

@Component({
  selector: 'app-payroll-detail',
  standalone: true,
  imports: [CommonModule, HeaderComponent, CardComponent, LoadingSpinnerComponent, IconComponent],
  template: `
    <div class="min-h-screen bg-stone-50">
      <app-header />

      <main class="max-w-4xl mx-auto px-4 py-8">
        <!-- Back Button -->
        <button
          (click)="goBack()"
          class="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 mb-6 transition-colors"
        >
          <app-icon name="arrow-left" size="16" />
          Back to Payroll
        </button>

        @if (isLoading()) {
          <div class="flex flex-col items-center justify-center py-16">
            <app-loading-spinner />
            <p class="text-zinc-600 mt-4">Loading payroll details...</p>
          </div>
        } @else if (payroll()) {
          <div class="space-y-6">
            <!-- Header Card -->
            <app-card class="border-l-4" [ngClass]="getHeaderBorderClass(payroll()!.status)">
              <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 class="text-2xl font-black text-zinc-900 mb-2">
                    {{ employeeName() }}
                  </h1>
                  <div class="flex items-center gap-4 text-sm text-zinc-600">
                    <span>{{ formatMonthYear(payroll()!.month, payroll()!.year) }}</span>
                    <span class="text-zinc-300">•</span>
                    <span>Employee ID: {{ payroll()!.employeeId }}</span>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-medium text-zinc-600 mb-1">Total Amount</div>
                  <div class="text-3xl font-black text-zinc-900">
                    {{ payroll()!.totalAmount | number:'1.0-0' }}
                  </div>
                  <span [class]="getStatusBadgeClass(payroll()!.status)" class="mt-3 inline-block">
                    {{ payroll()!.status | titlecase }}
                  </span>
                </div>
              </div>
            </app-card>

            <!-- Salary Info -->
            <app-card>
              <h2 class="text-lg font-bold text-zinc-900 mb-4">Salary Information</h2>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div class="text-xs font-semibold text-zinc-600 uppercase mb-1">Base Salary (Monthly)</div>
                  <div class="text-2xl font-bold text-zinc-900">{{ payroll()!.baseSalary | number:'1.0-0' }}</div>
                </div>
                <div>
                  <div class="text-xs font-semibold text-zinc-600 uppercase mb-1">Working Days</div>
                  <div class="text-2xl font-bold text-zinc-900">{{ payroll()!.workingDays }}</div>
                </div>
                <div>
                  <div class="text-xs font-semibold text-zinc-600 uppercase mb-1">Minutes per Day</div>
                  <div class="text-2xl font-bold text-zinc-900">{{ payroll()!.workingMinutesPerDay }}</div>
                </div>
              </div>
            </app-card>

            <!-- Attendance Summary -->
            <app-card>
              <h2 class="text-lg font-bold text-zinc-900 mb-4">Attendance Summary</h2>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="border-l-4 border-blue-500 pl-4">
                  <div class="text-xs font-semibold text-zinc-600 uppercase mb-2">Total Minutes Worked</div>
                  <div class="text-2xl font-bold text-zinc-900">
                    {{ payroll()!.attendanceData.totalMinutesWorked }}
                  </div>
                  <div class="text-xs text-zinc-500 mt-1">
                    {{ formatMinutesToHours(payroll()!.attendanceData.totalMinutesWorked) }}
                  </div>
                </div>
                <div class="border-l-4 border-amber-500 pl-4">
                  <div class="text-xs font-semibold text-zinc-600 uppercase mb-2">Expected Minutes</div>
                  <div class="text-2xl font-bold text-zinc-900">
                    {{ payroll()!.calculations.expectedMinutes }}
                  </div>
                  <div class="text-xs text-zinc-500 mt-1">
                    {{ formatMinutesToHours(payroll()!.calculations.expectedMinutes) }}
                  </div>
                </div>
                <div class="border-l-4 border-emerald-500 pl-4">
                  <div class="text-xs font-semibold text-zinc-600 uppercase mb-2">Total Days Worked</div>
                  <div class="text-2xl font-bold text-zinc-900">
                    {{ payroll()!.attendanceData.totalDaysWorked }}
                  </div>
                </div>
              </div>
            </app-card>

            <!-- Leave Summary -->
            <app-card>
              <h2 class="text-lg font-bold text-zinc-900 mb-4">Leave Summary</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="border-l-4 border-orange-500 pl-4">
                  <div class="text-xs font-semibold text-zinc-600 uppercase mb-2">Approved Leave Days</div>
                  <div class="text-2xl font-bold text-zinc-900">
                    {{ payroll()!.leaveData.approvedLeaveDays }}
                  </div>
                </div>
                <div class="border-l-4 border-rose-500 pl-4">
                  <div class="text-xs font-semibold text-zinc-600 uppercase mb-2">Approved Leave Minutes</div>
                  <div class="text-2xl font-bold text-zinc-900">
                    {{ payroll()!.leaveData.approvedLeaveMinutes }}
                  </div>
                  <div class="text-xs text-zinc-500 mt-1">
                    {{ formatMinutesToHours(payroll()!.leaveData.approvedLeaveMinutes) }}
                  </div>
                </div>
              </div>
            </app-card>

            <!-- Payable Minutes Calculation -->
            <app-card>
              <h2 class="text-lg font-bold text-zinc-900 mb-4">Payable Minutes Calculation</h2>
              <div class="bg-zinc-50 rounded-lg p-6">
                <div class="space-y-3">
                  <div class="flex justify-between">
                    <span class="text-zinc-600">Total Minutes Worked</span>
                    <span class="font-mono font-semibold text-zinc-900">
                      {{ payroll()!.attendanceData.totalMinutesWorked }}
                    </span>
                  </div>
                  <div class="flex justify-between border-b border-zinc-200 pb-3">
                    <span class="text-zinc-600">Minus: Approved Leave Minutes</span>
                    <span class="font-mono font-semibold text-zinc-900">
                      -{{ payroll()!.leaveData.approvedLeaveMinutes }}
                    </span>
                  </div>
                  <div class="flex justify-between pt-3">
                    <span class="font-semibold text-zinc-900">Payable Minutes</span>
                    <span class="font-mono font-bold text-lg text-emerald-700">
                      {{ payroll()!.calculations.payableMinutes }}
                    </span>
                  </div>
                </div>
              </div>
            </app-card>

            <!-- Regular Pay Amount -->
            <app-card>
              <h2 class="text-lg font-bold text-zinc-900 mb-4">Regular Pay Amount</h2>
              <div class="bg-zinc-50 rounded-lg p-6">
                <div class="space-y-3">
                  <div class="flex justify-between">
                    <span class="text-zinc-600">Base Salary</span>
                    <span class="font-mono font-semibold text-zinc-900">
                      {{ payroll()!.baseSalary | number:'1.0-0' }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-600">× (Payable Minutes / Expected Minutes)</span>
                    <span class="font-mono font-semibold text-zinc-900">
                      {{ payroll()!.calculations.payableMinutes }} / {{ payroll()!.calculations.expectedMinutes }}
                    </span>
                  </div>
                  <div class="flex justify-between border-b border-zinc-200 pb-3">
                    <span class="text-zinc-600">Ratio</span>
                    <span class="font-mono font-semibold text-zinc-900">
                      {{ (payroll()!.calculations.payableMinutes / payroll()!.calculations.expectedMinutes) | number:'1.2-2' }}
                    </span>
                  </div>
                  <div class="flex justify-between pt-3">
                    <span class="font-semibold text-zinc-900">Regular Pay Amount</span>
                    <span class="font-mono font-bold text-lg text-emerald-700">
                      {{ payroll()!.calculations.regularPayAmount | number:'1.0-0' }}
                    </span>
                  </div>
                </div>
              </div>
            </app-card>

            <!-- Adjustments -->
            @if (payroll()!.adjustments.bonuses.length > 0 || payroll()!.adjustments.deductions.length > 0) {
              <app-card>
                <h2 class="text-lg font-bold text-zinc-900 mb-4">Adjustments</h2>
                <div class="space-y-6">
                  @if (payroll()!.adjustments.bonuses.length > 0) {
                    <div>
                      <h3 class="font-semibold text-zinc-900 mb-3">Bonuses</h3>
                      <div class="space-y-2">
                        @for (bonus of payroll()!.adjustments.bonuses; track bonus.type) {
                          <div class="flex justify-between p-3 bg-emerald-50 rounded-lg">
                            <div>
                              <div class="font-medium text-zinc-900">{{ bonus.description }}</div>
                              <div class="text-xs text-zinc-500">{{ bonus.type | titlecase }}</div>
                            </div>
                            <div class="text-right">
                              <div class="font-mono font-bold text-emerald-700">+{{ bonus.amount | number:'1.0-0' }}</div>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  }

                  @if (payroll()!.adjustments.deductions.length > 0) {
                    <div>
                      <h3 class="font-semibold text-zinc-900 mb-3">Deductions</h3>
                      <div class="space-y-2">
                        @for (deduction of payroll()!.adjustments.deductions; track deduction.type) {
                          <div class="flex justify-between p-3 bg-red-50 rounded-lg">
                            <div>
                              <div class="font-medium text-zinc-900">{{ deduction.description }}</div>
                              <div class="text-xs text-zinc-500">{{ deduction.type | titlecase }}</div>
                            </div>
                            <div class="text-right">
                              <div class="font-mono font-bold text-red-700">-{{ deduction.amount | number:'1.0-0' }}</div>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              </app-card>
            }

            <!-- Metadata -->
            <app-card class="bg-zinc-50">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div>
                  <div class="font-semibold text-zinc-600 mb-1">Created</div>
                  <div class="text-zinc-900">
                    {{ payroll()!.createdAt ? formatDate(payroll()!.createdAt) : 'N/A' }}
                  </div>
                </div>
                <div>
                  <div class="font-semibold text-zinc-600 mb-1">Last Updated</div>
                  <div class="text-zinc-900">
                    {{ payroll()!.updatedAt ? formatDate(payroll()!.updatedAt) : 'N/A' }}
                  </div>
                </div>
              </div>
            </app-card>
          </div>
        } @else {
          <app-card>
            <div class="text-center py-16">
              <div class="inline-block p-4 bg-red-100 rounded-full mb-4">
                <app-icon name="alert-circle" size="24" class="text-red-600" />
              </div>
              <h3 class="font-semibold text-zinc-900 mb-1">Payroll Not Found</h3>
              <p class="text-zinc-600 text-sm mb-6">
                The requested payroll record could not be found or you don't have access to view it.
              </p>
              <button
                (click)="goBack()"
                class="px-4 py-2 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 transition-colors"
              >
                Back to Payroll
              </button>
            </div>
          </app-card>
        }
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PayrollDetailComponent implements OnInit {
  private api = inject(ApiService);
  private employeeService = inject(EmployeeService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  payroll = signal<Payroll | null>(null);
  employeeName = signal<string>('Loading...');
  isLoading = signal(false);

  ngOnInit() {
    this.route.params.subscribe(params => {
      const payrollId = params['id'];
      if (payrollId) {
        this.loadPayrollDetail(payrollId);
      }
    });
  }

  private loadPayrollDetail(payrollId: string) {
    this.isLoading.set(true);

    this.api.getAllPayroll().subscribe({
      next: (payrollList) => {
        const found = payrollList.find(p => p.id === payrollId);
        if (found) {
          this.payroll.set(found);
          this.loadEmployeeName(found.employeeId);
        } else {
          this.payroll.set(null);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load payroll detail:', err);
        this.payroll.set(null);
        this.isLoading.set(false);
      }
    });
  }

  private loadEmployeeName(employeeId: string) {
    this.employeeService.getEmployeeById(employeeId).then(emp => {
      if (emp) {
        this.employeeName.set(emp.name);
      }
    }).catch(err => {
      console.error('Failed to load employee name:', err);
      this.employeeName.set('Unknown Employee');
    });
  }

  goBack() {
    this.router.navigate(['/payroll']);
  }

  formatMonthYear(month: number, year: number): string {
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  formatMinutesToHours(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  formatDate(date: Date | any): string {
    if (!date) return 'N/A';
    if (typeof date === 'object' && 'toDate' in date) {
      return date.toDate().toLocaleDateString('en-US');
    }
    if (date instanceof Date) {
      return date.toLocaleDateString('en-US');
    }
    return new Date(date).toLocaleDateString('en-US');
  }

  getStatusBadgeClass(status: string): string {
    const baseClass = 'px-3 py-1 rounded-full text-xs font-semibold';
    if (status === 'generated') {
      return `${baseClass} bg-blue-50 text-blue-700`;
    }
    if (status === 'finalized') {
      return `${baseClass} bg-emerald-50 text-emerald-700`;
    }
    return `${baseClass} bg-zinc-50 text-zinc-700`;
  }

  getHeaderBorderClass(status: string): string {
    if (status === 'finalized') {
      return 'border-emerald-500';
    }
    return 'border-blue-500';
  }
}
