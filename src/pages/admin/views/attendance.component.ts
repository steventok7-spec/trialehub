
import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { IconComponent } from '../../../components/ui/icon.component';

interface AttendanceRecord {
  employeeName: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  hours: string | null;
  id: string; // For unique tracking
}

interface GroupedAttendance {
  date: string;
  formattedDate: string;
  records: AttendanceRecord[];
}

@Component({
  selector: 'admin-attendance',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="max-w-3xl mx-auto">
      @if(loading()) {
        <div class="text-center py-24 text-zinc-500">
           <div class="w-10 h-10 mx-auto border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mb-4"></div>
           <p class="font-medium">Loading attendance records...</p>
        </div>
      } @else {
        <div class="space-y-8">
          @for (group of groupedRecords(); track group.date) {
            <div>
              <div class="sticky top-[70px] bg-zinc-50/95 backdrop-blur-md z-10 py-3 mb-4 border-b border-zinc-200/60">
                 <h4 class="font-bold text-xs uppercase tracking-widest text-zinc-400">{{ group.formattedDate }}</h4>
              </div>
              
              <div class="space-y-4">
                @for (record of group.records; track record.id) {
                  <div 
                    (click)="toggleExpand(record.id)"
                    class="bg-white rounded-3xl p-6 cursor-pointer active:scale-[0.99] transition-all duration-300 hover:shadow-xl shadow-sm border border-zinc-100 group"
                    [class.ring-2]="isExpanded(record.id)"
                    [class.ring-zinc-900]="isExpanded(record.id)"
                    [class.border-transparent]="isExpanded(record.id)"
                  >
                    <!-- Main Row -->
                    <div class="flex items-center gap-6">
                      <!-- Avatar/Icon -->
                       <div class="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all border border-zinc-100 group-hover:scale-110"
                            [class.bg-emerald-50]="!isLate(record.check_in)"
                            [class.text-emerald-600]="!isLate(record.check_in)"
                            [class.bg-amber-50]="isLate(record.check_in)"
                            [class.text-amber-600]="isLate(record.check_in)">
                          <span class="font-black text-xl uppercase tracking-tighter">{{ record.employeeName.charAt(0) }}</span>
                       </div>
 
                      <div class="flex-1 min-w-0">
                        <p class="font-black text-zinc-900 truncate tracking-tight text-xl">{{ record.employeeName }}</p>
                        <div class="flex items-center gap-4 text-sm mt-2 font-black tabular-nums">
                          <div class="flex items-center gap-2 text-zinc-500">
                            <app-icon name="clock" size="16" class="opacity-30"/>
                            <span>{{ formatTime(record.check_in) }}</span>
                          </div>
                           @if(record.check_out) {
                             <span class="text-zinc-300">→</span>
                             <span class="text-zinc-900">{{ formatTime(record.check_out) }}</span>
                           }
                        </div>
                      </div>
                      
                      @if(record.hours) {
                        <div class="text-right flex-shrink-0 hidden sm:block">
                           <span class="block font-black text-zinc-900 text-2xl leading-none">{{ record.hours }}</span>
                           <span class="text-[10px] uppercase font-black text-zinc-400 tracking-[0.2em] mt-2 block">HRS</span>
                        </div>
                       }
                    </div>
 
                    <!-- Details (Expandable) -->
                    <div class="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                         [class.grid-rows-[1fr]]="isExpanded(record.id)">
                      <div class="overflow-hidden">
                        <div class="pt-6 mt-6 border-t border-zinc-100 space-y-5">
                           <div class="flex justify-between items-center bg-zinc-50 p-5 rounded-2xl border border-zinc-100">
                              <span class="text-zinc-500 font-black uppercase text-[10px] tracking-[0.2em]">Punctuality</span>
                              @if(isLate(record.check_in)) {
                                <span class="flex items-center gap-2 px-4 py-2 text-xs font-black text-amber-700 bg-amber-100 rounded-xl">
                                  <app-icon name="alert-circle" size="14"/> LATE
                                </span>
                              } @else {
                                <span class="flex items-center gap-2 px-4 py-2 text-xs font-black text-emerald-700 bg-emerald-100 rounded-xl">
                                  <app-icon name="check-circle" size="14"/> ON TIME
                                </span>
                              }
                           </div>
                           
                           <div class="grid grid-cols-2 gap-4">
                             <div class="p-5 bg-zinc-50 rounded-2xl border border-zinc-100">
                               <p class="text-[10px] text-zinc-400 uppercase mb-3 font-black tracking-[0.2em]">In (Raw)</p>
                               <p class="font-black text-zinc-900 text-lg tabular-nums">{{ record.check_in || '--:--' }}</p>
                             </div>
                             <div class="p-5 bg-zinc-50 rounded-2xl border border-zinc-100">
                               <p class="text-[10px] text-zinc-400 uppercase mb-3 font-black tracking-[0.2em]">Out (Raw)</p>
                               <p class="font-black text-zinc-900 text-lg tabular-nums">{{ record.check_out || '--:--' }}</p>
                             </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          } @empty {
            <div class="flex flex-col items-center justify-center py-32 text-zinc-400">
                <div class="p-6 bg-zinc-100 rounded-full mb-6 text-zinc-300">
                  <app-icon name="calendar" size="48"/>
                </div>
                <p class="font-bold text-lg text-zinc-900">No records found</p>
                <p class="text-sm mt-1 text-zinc-400">Try selecting a different date or employee.</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminAttendance implements OnInit {
  private api = inject(ApiService);
  attendanceRecords = signal<AttendanceRecord[]>([]);
  loading = signal(true);
  expandedRecordId = signal<string | null>(null);

  groupedRecords = computed<GroupedAttendance[]>(() => {
    const records = this.attendanceRecords();
    if (!records.length) return [];

    const grouped = records.reduce((acc, record) => {
      const date = record.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(record);
      return acc;
    }, {} as Record<string, AttendanceRecord[]>);

    return Object.keys(grouped)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map(date => ({
        date,
        formattedDate: this.formatDateHeader(date),
        records: grouped[date]
      }));
  });

  ngOnInit() {
    this.api.getAllAttendance().subscribe(data => {
      const recordsWithIds = data.map((d, i) => ({ ...d, id: `${d.date}-${d.employeeName}-${i}` }));
      this.attendanceRecords.set(recordsWithIds);
      this.loading.set(false);
    });
  }

  toggleExpand(recordId: string) {
    this.expandedRecordId.update(current => current === recordId ? null : recordId);
  }

  isExpanded(recordId: string): boolean {
    return this.expandedRecordId() === recordId;
  }

  formatTime(time: string | null): string {
    if (!time) return '--:--';
    return time;
  }

  isLate(time: string | null): boolean {
    if (!time) return false;
    try {
      // Try parsing as ISO date first (from database)
      const date = new Date(time);
      if (!isNaN(date.getTime())) {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        return hours > 9 || (hours === 9 && minutes > 0);
      }
      // Fallback: parse locale time string format "10:00 AM"
      const [hourMinute, period] = time.split(' ');
      if (!period) return false;
      let [hours, minutes] = hourMinute.split(':').map(Number);
      if (period.toLowerCase() === 'pm' && hours < 12) {
        hours += 12;
      }
      if (period.toLowerCase() === 'am' && hours === 12) {
        hours = 0;
      }
      return hours > 9 || (hours === 9 && minutes > 0);
    } catch {
      return false;
    }
  }

  formatDateHeader(dateStr: string): string {
    const date = new Date(dateStr + 'T12:00:00Z');
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const dateDay = date.toLocaleDateString('en-CA', { timeZone: 'UTC' });
    const todayDay = today.toLocaleDateString('en-CA');
    const yesterdayDay = yesterday.toLocaleDateString('en-CA');

    if (dateDay === todayDay) {
      return `Today`;
    }
    if (dateDay === yesterdayDay) {
      return `Yesterday`;
    }
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
  }
}
