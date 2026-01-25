
import { Component, input, output, signal, OnInit, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../components/ui/icon.component';
import { Employee } from '../../../models';

@Component({
   selector: 'app-schedule-employee-modal',
   standalone: true,
   imports: [FormsModule, CommonModule, IconComponent],
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
                 Weekly Schedule
               </h1>
               <p class="text-sm text-zinc-500 font-medium hidden sm:block">
                 {{ employee().name }}
               </p>
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
                (click)="onSave()"
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
      <div class="flex-1 overflow-y-auto">
        <div class="max-w-3xl mx-auto p-4 sm:p-8 space-y-6 pb-32">
           
           <!-- Employee Info Card (Mobile Visible) -->
           <div class="sm:hidden flex items-center gap-4 bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
              <div class="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-900 font-bold border border-zinc-200">
                {{ employee().name.charAt(0) }}
              </div>
              <div>
                 <p class="font-bold text-zinc-900">{{ employee().name }}</p>
                 <p class="text-xs text-zinc-500">{{ employee().job_title | titlecase }}</p>
              </div>
           </div>

           <!-- Schedule Form -->
           <form #scheduleForm="ngForm" class="space-y-6">
              
              <section class="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
                 <div class="flex items-center gap-3 mb-6">
                    <div class="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-900">
                       <app-icon name="calendar" size="20"/>
                    </div>
                    <h3 class="text-lg font-bold text-zinc-900">Working Days</h3>
                 </div>
                 
                 <div class="space-y-3">
                    @for(day of days; track day.key) {
                      <label 
                        [for]="day.key" 
                        class="flex items-center justify-between w-full p-4 border rounded-xl cursor-pointer transition-all hover:bg-zinc-50"
                        [class.bg-zinc-900]="schedule[day.key]"
                        [class.border-zinc-900]="schedule[day.key]"
                        [class.text-white]="schedule[day.key]"
                        [class.bg-white]="!schedule[day.key]"
                        [class.border-zinc-200]="!schedule[day.key]"
                        [class.text-zinc-700]="!schedule[day.key]"
                      >
                        <div class="flex items-center gap-3">
                           <div class="w-2 h-2 rounded-full" [class.bg-white]="schedule[day.key]" [class.bg-zinc-300]="!schedule[day.key]"></div>
                           <span class="font-bold">{{ day.fullName }}</span>
                        </div>
                        
                        <div class="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" [name]="day.key" [id]="day.key" [(ngModel)]="schedule[day.key]" class="sr-only peer">
                          
                          <!-- Custom Toggle -->
                          <div 
                             class="w-11 h-6 rounded-full transition-colors relative"
                             [class.bg-zinc-700]="schedule[day.key]"
                             [class.bg-zinc-200]="!schedule[day.key]"
                          >
                             <div 
                                class="absolute top-[2px] left-[2px] h-5 w-5 bg-white rounded-full transition-transform shadow-sm"
                                [class.translate-x-full]="schedule[day.key]"
                             ></div>
                          </div>
                        </div>
                      </label>
                    }
                 </div>
                  <!-- Mobile Save Button (In-Flow) -->
                  <div class="sm:hidden pt-4">
                    <button 
                       type="button" 
                       (click)="onSave()"
                       [disabled]="loading()"
                       class="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold shadow-xl shadow-zinc-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                       @if (loading()) {
                          <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                       }
                       {{ loading() ? 'Saving Changes...' : 'Save Schedule' }}
                    </button>
                  </div>
               </section>

           </form>
        </div>
      </div>
      

    </div>
  `,
   styles: [`
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    .animate-fade-in { animation: fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
  `],
   changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleEmployeeModalComponent implements OnInit {
   employee = input.required<Employee>();
   close = output<void>();
   save = output<{ employeeId: string, schedule: any }>();

   loading = signal(false);
   schedule: any = {};

   days = [
      { key: 'mon', label: 'Mon', fullName: 'Monday' },
      { key: 'tue', label: 'Tue', fullName: 'Tuesday' },
      { key: 'wed', label: 'Wed', fullName: 'Wednesday' },
      { key: 'thu', label: 'Thu', fullName: 'Thursday' },
      { key: 'fri', label: 'Fri', fullName: 'Friday' },
      { key: 'sat', label: 'Sat', fullName: 'Saturday' },
      { key: 'sun', label: 'Sun', fullName: 'Sunday' }
   ];

   @HostListener('document:keydown.escape')
   onEscapeKey() {
      this.close.emit();
   }

   ngOnInit() {
      this.schedule = { ...this.employee().schedule };
   }

   onSave() {
      this.loading.set(true);
      this.save.emit({ employeeId: this.employee().id, schedule: this.schedule });
   }
}
