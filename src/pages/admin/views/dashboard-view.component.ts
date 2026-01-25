
import { Component, OnInit, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { IconComponent } from '../../../components/ui/icon.component';

@Component({
  selector: 'admin-dashboard-view',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    @if(loading()){
      <div class="flex flex-col items-center justify-center py-20 text-zinc-400">
         <div class="w-8 h-8 border-2 border-stone-200 border-t-zinc-900 rounded-full animate-spin mb-3"></div>
         <span>Loading data...</span>
      </div>
    } @else if (summaryData()) {
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        
        <!-- Card 1: Total Employees (Zinc Color) -->
        <div 
          (click)="navigate.emit('employees')"
          class="bg-white p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-stone-100 flex items-center gap-5 transition-transform active:scale-[0.98] cursor-pointer hover:border-zinc-200"
        >
           <div class="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center flex-shrink-0 border border-zinc-100">
            <app-icon name="users" size="28" class="text-zinc-900"/>
          </div>
          <div>
            <div class="text-sm font-medium text-zinc-500 mb-1">Total Employees</div>
            <div class="text-3xl font-bold text-zinc-800 tracking-tight">{{ summaryData()!.totalEmployees }}</div>
          </div>
        </div>

        <!-- Card 2: Present (Zinc Color) -->
        <div 
          (click)="navigate.emit('attendance')"
          class="bg-white p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-stone-100 flex items-center gap-5 transition-transform active:scale-[0.98] cursor-pointer hover:border-zinc-200"
        >
          <div class="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center flex-shrink-0 border border-zinc-100">
            <app-icon name="check-circle" size="28" class="text-zinc-900"/>
          </div>
          <div>
            <div class="text-sm font-medium text-zinc-500 mb-1">Present Today</div>
            <div class="text-3xl font-bold text-zinc-800 tracking-tight">{{ summaryData()!.presentToday }}</div>
          </div>
        </div>

        <!-- Card 3: On Leave (Zinc Color) -->
        <div 
          (click)="navigate.emit('leave')"
          class="bg-white p-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-stone-100 flex items-center gap-5 transition-transform active:scale-[0.98] cursor-pointer hover:border-zinc-200 sm:col-span-2 lg:col-span-1"
        >
          <div class="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center flex-shrink-0 border border-zinc-100">
            <app-icon name="calendar-days" size="28" class="text-zinc-900"/>
          </div>
          <div>
            <div class="text-sm font-medium text-zinc-500 mb-1">On Leave</div>
            <div class="text-3xl font-bold text-zinc-800 tracking-tight">{{ summaryData()!.onLeave }}</div>
          </div>
        </div>
      </div>
    } @else {
       <div class="text-center p-10 text-red-500 bg-red-50 rounded-xl">Could not load dashboard data.</div>
    }
    
    <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 min-h-[300px] flex flex-col items-center justify-center text-zinc-400">
      <app-icon name="layout-dashboard" size="48" class="text-zinc-300 mb-4"/>
      <p>Activity Chart Visualization</p>
    </div>
  `
})
export class AdminDashboardView implements OnInit {
  private api = inject(ApiService);
  @Output() navigate = new EventEmitter<string>();
  summaryData = signal<{ totalEmployees: number, presentToday: number, onLeave: number } | null>(null);
  loading = signal(true);

  ngOnInit() {
    this.api.getAdminSummary().subscribe(data => {
      this.summaryData.set(data);
      this.loading.set(false);
    });
  }
}
