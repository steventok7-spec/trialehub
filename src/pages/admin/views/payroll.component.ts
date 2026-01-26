
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { IconComponent } from '../../../components/ui/icon.component';
import { PayrollEntry } from '../../../models';

@Component({
  selector: 'admin-payroll',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="bg-white rounded-2xl shadow-sm border border-zinc-100 p-8 min-h-[500px]">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
        <div>
           <h3 class="font-bold text-2xl text-zinc-900 tracking-tight">Payroll Summary</h3>
           <p class="text-sm text-zinc-500 mt-1">Calculate net pay based on active attendance & claims</p>
        </div>
        
        <div class="flex items-center gap-3 w-full md:w-auto">
          <input 
            type="month" 
            [(ngModel)]="selectedMonth" 
            (change)="loadPayroll()"
            class="flex-1 md:flex-none px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all outline-none"
          />
          <button (click)="exportToCsv()" class="px-5 py-2.5 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-zinc-900/10">
            <app-icon name="download" size="18"/>
            <span>Export</span>
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-32 text-zinc-500">
           <div class="w-12 h-12 border-4 border-zinc-100 border-t-zinc-900 rounded-full animate-spin mb-6"></div>
           <span class="font-bold text-zinc-900">Calculating salaries...</span>
           <p class="text-sm mt-1">Generating report for {{ selectedMonth }}</p>
        </div>
      } @else if (payrollData().length > 0) {
        <div class="overflow-x-auto -mx-8">
          <table class="w-full text-sm text-left border-collapse">
            <thead class="text-[10px] text-zinc-400 uppercase tracking-widest bg-zinc-50/50 border-y border-zinc-100">
              <tr>
                <th class="px-8 py-4 font-bold">Employee</th>
                <th class="px-6 py-4 font-bold">Type</th>
                <th class="px-6 py-4 font-bold text-right">Base Salary / Rate</th>
                <th class="px-6 py-4 font-bold text-right">Work Hours</th>
                <th class="px-6 py-4 font-bold text-right">Claims</th>
                <th class="px-8 py-4 font-bold text-right text-zinc-900">Net Pay</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-50">
              @for (entry of payrollData(); track entry.employeeId) {
                <tr class="hover:bg-zinc-50/50 transition-colors group">
                  <td class="px-8 py-5">
                    <div class="flex flex-col">
                      <span class="font-bold text-zinc-900 text-base leading-none">{{ entry.name }}</span>
                      <span class="text-[10px] text-zinc-400 mt-1 uppercase tracking-tighter">{{ entry.employeeId }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-5 border-l border-zinc-50/50">
                    <span class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
                      [class.bg-blue-50]="entry.employmentType === 'full_time'"
                      [class.text-blue-600]="entry.employmentType === 'full_time'"
                      [class.bg-purple-50]="entry.employmentType === 'part_time'"
                      [class.text-purple-600]="entry.employmentType === 'part_time'"
                    >
                      {{ entry.employmentType === 'full_time' ? 'Full Time' : 'Part Time' }}
                    </span>
                  </td>
                  <td class="px-6 py-5 text-right font-mono font-bold text-zinc-600">{{ entry.baseSalary | currency:'IDR':'symbol':'1.0-0' }}</td>
                  <td class="px-6 py-5 text-right font-mono font-medium text-zinc-400">
                    {{ entry.employmentType === 'part_time' ? (entry.totalAttendanceHours | number:'1.1-1') + 'h' : '—' }}
                  </td>
                  <td class="px-6 py-5 text-right font-mono font-bold text-emerald-600">
                    +{{ entry.approvedClaims | currency:'IDR':'symbol':'1.0-0' }}
                  </td>
                  <td class="px-8 py-5 text-right font-mono font-bold text-zinc-900 text-lg bg-zinc-50/30 group-hover:bg-zinc-100/50 transition-colors">
                    {{ entry.netPay | currency:'IDR':'symbol':'1.0-0' }}
                  </td>
                </tr>
              }
            </tbody>
            <tfoot class="bg-zinc-900 text-white shadow-xl">
               <tr>
                 <td colspan="5" class="px-8 py-6 text-right font-bold uppercase tracking-widest text-xs opacity-60">Total Payout:</td>
                 <td class="px-8 py-6 text-right font-mono font-bold text-2xl border-l border-white/10">
                   {{ totalPayout() | currency:'IDR':'symbol':'1.0-0' }}
                 </td>
               </tr>
            </tfoot>
          </table>
        </div>
      } @else {
        <div class="text-center py-32 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-200">
          <div class="p-6 bg-white rounded-2xl shadow-sm inline-block mb-6 text-zinc-300 border border-zinc-100">
            <app-icon name="calendar" size="48"/>
          </div>
          <p class="text-zinc-900 font-bold text-xl">No payroll data</p>
          <p class="text-zinc-500 text-sm mt-1 max-w-xs mx-auto">We couldn't find any records for {{ selectedMonth }}. Please check attendance first.</p>
        </div>
      }
    </div>
  `
})
export class AdminPayrollComponent implements OnInit {
  private api = inject(ApiService);

  // Default to current month YYYY-MM
  selectedMonth = new Date().toISOString().slice(0, 7);
  payrollData = signal<PayrollEntry[]>([]);
  loading = signal(false);

  totalPayout = signal(0);

  ngOnInit() {
    this.loadPayroll();
  }

  loadPayroll() {
    this.loading.set(true);
    const [year, month] = this.selectedMonth.split('-').map(Number);

    this.api.generatePayroll(year, month)
      .then(data => {
        this.payrollData.set(data);
        this.totalPayout.set(data.reduce((sum, item) => sum + item.netPay, 0));
      })
      .catch(err => {
        console.error('Payroll generation failed:', err);
        this.payrollData.set([]);
        this.totalPayout.set(0);
      })
      .finally(() => this.loading.set(false));
  }

  exportToCsv() {
    if (this.payrollData().length === 0) return;

    const headers = ['Employee ID', 'Name', 'Type', 'Base Salary', 'Work Hours', 'Claims', 'Net Pay'];
    const rows = this.payrollData().map(p => [
      p.employeeId,
      p.name,
      p.employmentType,
      p.baseSalary,
      p.totalAttendanceHours.toFixed(2),
      p.approvedClaims,
      p.netPay
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_${this.selectedMonth}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
