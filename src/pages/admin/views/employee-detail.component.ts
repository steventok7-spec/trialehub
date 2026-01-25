
import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { IconComponent } from '../../../components/ui/icon.component';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  template: `
    <div class="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div class="max-w-4xl mx-auto">
        <a routerLink="/admin/dashboard" [queryParams]="{ tab: 'employees' }" class="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 mb-6 transition-colors">
          <app-icon name="chevrons-left" size="18"/>
          Back to Directory
        </a>
        
        @if (loading()) {
          <div class="flex flex-col items-center justify-center py-20 text-slate-400">
             <div class="w-8 h-8 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
             <span>Loading employee...</span>
          </div>
        } @else if (employeeData()) {
          <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div class="p-6 sm:p-8">
                <!-- Header -->
                <div class="flex items-center gap-6 mb-8">
                  <div class="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-indigo-100 flex-shrink-0">
                    {{ employeeData()!.details.name.charAt(0) }}
                  </div>
                  <div>
                    <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{{ employeeData()!.details.name }}</h1>
                    <p class="text-lg text-slate-500 font-medium">{{ employeeData()!.details.role }}</p>
                  </div>
                </div>

                <!-- Info Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div class="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Employee ID</div>
                    <div class="text-slate-900 font-mono font-medium">{{ employeeData()!.details.id }}</div>
                  </div>
                  <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div class="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Email Address</div>
                    <div class="text-slate-900 font-medium">{{ employeeData()!.details.email }}</div>
                  </div>
                </div>

                <!-- Tabs -->
                <div class="border-b border-slate-200">
                  <nav class="-mb-px flex space-x-8" aria-label="Tabs">
                    <button (click)="activeTab.set('attendance')" [class]="getTabClass('attendance')">
                      Attendance
                    </button>
                    <button (click)="activeTab.set('leave')" [class]="getTabClass('leave')">
                      Leave History
                    </button>
                    <button (click)="activeTab.set('claims')" [class]="getTabClass('claims')">
                      Expense Claims
                    </button>
                  </nav>
                </div>
                
                <!-- Tab Content -->
                <div class="py-6 animate-content">
                   @switch (activeTab()) {
                    @case ('attendance') {
                      <div class="overflow-x-auto">
                          <table class="w-full text-sm text-left">
                            <thead class="text-xs text-slate-500 uppercase bg-slate-50">
                              <tr>
                                <th class="px-4 py-3 rounded-l-lg">Date</th>
                                <th class="px-4 py-3">Check In</th>
                                <th class="px-4 py-3">Check Out</th>
                                <th class="px-4 py-3 rounded-r-lg">Hours</th>
                              </tr>
                            </thead>
                            <tbody>
                              @for(item of employeeData()!.attendance; track item.date) {
                                <tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                  <td class="px-4 py-3 font-medium text-slate-900">{{ item.date }}</td>
                                  <td class="px-4 py-3 font-mono text-slate-600">{{ item.check_in || '-' }}</td>
                                  <td class="px-4 py-3 font-mono text-slate-600">{{ item.check_out || '-' }}</td>
                                  <td class="px-4 py-3 font-bold text-slate-700">{{ item.hours }}</td>
                                </tr>
                              } @empty {
                                <tr><td colspan="4" class="text-center p-8 text-slate-400">No attendance records found.</td></tr>
                              }
                            </tbody>
                          </table>
                      </div>
                    }
                    @case ('leave') {
                      <div class="overflow-x-auto">
                          <table class="w-full text-sm text-left">
                             <thead class="text-xs text-slate-500 uppercase bg-slate-50">
                              <tr>
                                <th class="px-4 py-3 rounded-l-lg">From</th>
                                <th class="px-4 py-3">To</th>
                                <th class="px-4 py-3">Reason</th>
                                <th class="px-4 py-3 rounded-r-lg">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                               @for(item of employeeData()!.leave; track item.from) {
                                <tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                  <td class="px-4 py-3 font-medium text-slate-900">{{ item.from }}</td>
                                  <td class="px-4 py-3 font-medium text-slate-900">{{ item.to }}</td>
                                  <td class="px-4 py-3 text-slate-600">{{ item.reason }}</td>
                                  <td class="px-4 py-3"><span class="px-2.5 py-1 text-xs font-bold text-green-700 bg-green-100 rounded-full">{{ item.status }}</span></td>
                                </tr>
                              } @empty {
                                 <tr><td colspan="4" class="text-center p-8 text-slate-400">No leave requests found.</td></tr>
                              }
                            </tbody>
                          </table>
                      </div>
                    }
                    @case ('claims') {
                      <div class="overflow-x-auto">
                          <table class="w-full text-sm text-left">
                             <thead class="text-xs text-slate-500 uppercase bg-slate-50">
                              <tr>
                                <th class="px-4 py-3 rounded-l-lg">Date</th>
                                <th class="px-4 py-3">Amount</th>
                                <th class="px-4 py-3">Description</th>
                                <th class="px-4 py-3 rounded-r-lg">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                               @for(item of employeeData()!.claims; track item.date) {
                                <tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                  <td class="px-4 py-3 font-medium text-slate-900">{{ item.date }}</td>
                                  <td class="px-4 py-3 font-mono font-bold text-slate-900">{{ item.amount }}</td>
                                  <td class="px-4 py-3 text-slate-600">{{ item.description }}</td>
                                  <td class="px-4 py-3"><span class="px-2.5 py-1 text-xs font-bold text-green-700 bg-green-100 rounded-full">{{ item.status }}</span></td>
                                </tr>
                              } @empty {
                                 <tr><td colspan="4" class="text-center p-8 text-slate-400">No claims found.</td></tr>
                              }
                            </tbody>
                          </table>
                      </div>
                    }
                  }
                </div>
            </div>
          </div>
        } @else {
          <div class="text-center p-10 text-red-500 bg-red-50 rounded-xl">Could not find employee data.</div>
        }
      </div>
    </div>
  `,
  styles: [`
    @keyframes contentFadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-content {
      animation: contentFadeIn 0.3s ease-out forwards;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  employeeId: string | null = null;
  employeeData = signal<any | null>(null);
  activeTab = signal('attendance');
  loading = signal(true);

  ngOnInit() {
    this.employeeId = this.route.snapshot.paramMap.get('id');
    if (this.employeeId) {
      this.api.getEmployeeDetails(this.employeeId).subscribe(data => {
        this.employeeData.set(data);
        this.loading.set(false);
      });
    } else {
      this.loading.set(false);
    }
  }

  getTabClass(tabName: string): string {
    const base = 'py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 outline-none focus:outline-none';
    if (this.activeTab() === tabName) {
      return `${base} border-indigo-600 text-indigo-600`;
    }
    return `${base} border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300`;
  }
}
