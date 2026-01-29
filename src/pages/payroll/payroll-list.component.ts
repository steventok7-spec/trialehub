import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../auth/auth.service';
import { EmployeeService } from '../../services/employee.service';
import { Payroll } from '../../models/payroll.model';
import { HeaderComponent } from '../../components/layout/header.component';
import { CardComponent } from '../../components/ui/card.component';
import { LoadingSpinnerComponent } from '../../components/ui/loading-spinner.component';
import { IconComponent } from '../../components/ui/icon.component';

@Component({
  selector: 'app-payroll-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, HeaderComponent, CardComponent, LoadingSpinnerComponent, IconComponent],
  template: `
    <div class="min-h-screen bg-stone-50">
      <app-header />

      <main class="max-w-7xl mx-auto px-4 py-8">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-black text-zinc-900 mb-2">
            {{ isOwner() ? 'Payroll Management' : 'My Payroll' }}
          </h1>
          <p class="text-zinc-600">
            {{ isOwner() ? 'View and manage all employee payroll records' : 'View your payroll records' }}
          </p>
        </div>

        <!-- Controls (Owner only) -->
        @if (isOwner()) {
          <div class="bg-white rounded-xl shadow-sm border border-zinc-100 p-6 mb-6">
            <label class="block text-sm font-semibold text-zinc-700 mb-2">Filter by Month</label>
            <input
              type="month"
              [(ngModel)]="selectedMonth"
              (change)="onMonthChange()"
              class="px-4 py-2 border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent outline-none"
            />
          </div>
        }

        <!-- Payroll Table -->
        <app-card>
          @if (isLoading()) {
            <div class="flex flex-col items-center justify-center py-16">
              <app-loading-spinner />
              <p class="text-zinc-600 mt-4">Loading payroll records...</p>
            </div>
          } @else if (filteredPayroll().length > 0) {
            <div class="overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead class="text-xs font-semibold text-zinc-600 uppercase bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    @if (isOwner()) {
                      <th class="px-6 py-3">Employee</th>
                    }
                    <th class="px-6 py-3">Month / Year</th>
                    <th class="px-6 py-3 text-right">Total Amount</th>
                    <th class="px-6 py-3">Status</th>
                    <th class="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-100">
                  @for (payroll of filteredPayroll(); track payroll.id) {
                    <tr class="hover:bg-zinc-50/50 transition-colors">
                      @if (isOwner()) {
                        <td class="px-6 py-4">
                          <div class="font-medium text-zinc-900">
                            {{ getEmployeeName(payroll.employeeId) }}
                          </div>
                          <div class="text-xs text-zinc-500">{{ payroll.employeeId }}</div>
                        </td>
                      }
                      <td class="px-6 py-4">
                        <div class="font-medium text-zinc-900">
                          {{ formatMonthYear(payroll.month, payroll.year) }}
                        </div>
                      </td>
                      <td class="px-6 py-4 text-right font-mono font-semibold text-zinc-900">
                        {{ payroll.totalAmount | number:'1.0-0' }}
                      </td>
                      <td class="px-6 py-4">
                        <span [class]="getStatusBadgeClass(payroll.status)">
                          {{ payroll.status | titlecase }}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <a
                          [routerLink]="['/payroll', payroll.id]"
                          class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                        >
                          <app-icon name="eye" size="16" />
                          View
                        </a>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="text-center py-16">
              <div class="inline-block p-4 bg-zinc-100 rounded-full mb-4">
                <app-icon name="calendar" size="24" class="text-zinc-600" />
              </div>
              <h3 class="font-semibold text-zinc-900 mb-1">No payroll records</h3>
              <p class="text-zinc-600 text-sm">
                {{ isOwner()
                  ? 'No payroll records found for the selected month. Generate payroll to see records here.'
                  : 'No payroll records available yet.'
                }}
              </p>
            </div>
          }
        </app-card>
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PayrollListComponent implements OnInit {
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private employeeService = inject(EmployeeService);

  private payrollData = signal<Payroll[]>([]);
  private employeeNames = new Map<string, string>();
  isLoading = signal(false);

  selectedMonth = this.getCurrentMonthString();
  isOwner = computed(() => this.authService.isOwner());

  filteredPayroll = computed(() => {
    const data = this.payrollData();
    if (!this.isOwner()) {
      return data;
    }

    // Filter by month if owner
    const [year, month] = this.selectedMonth.split('-').map(Number);
    return data.filter(p => p.month === month && p.year === year);
  });

  ngOnInit() {
    this.loadPayroll();
  }

  private loadPayroll() {
    this.isLoading.set(true);

    this.api.getAllPayroll().subscribe({
      next: (payroll) => {
        this.payrollData.set(payroll);
        // Pre-cache employee names
        payroll.forEach(p => {
          if (!this.employeeNames.has(p.employeeId)) {
            this.loadEmployeeName(p.employeeId);
          }
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load payroll:', err);
        this.payrollData.set([]);
        this.isLoading.set(false);
      }
    });
  }

  private loadEmployeeName(employeeId: string) {
    this.employeeService.getEmployeeById(employeeId).then(emp => {
      if (emp) {
        this.employeeNames.set(employeeId, emp.name);
      }
    }).catch(err => {
      console.error('Failed to load employee name:', err);
    });
  }

  getEmployeeName(employeeId: string): string {
    return this.employeeNames.get(employeeId) || 'Loading...';
  }

  onMonthChange() {
    // Filter is computed, so just trigger reactivity
  }

  formatMonthYear(month: number, year: number): string {
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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

  private getCurrentMonthString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
}
