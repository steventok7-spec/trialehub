
import { Component } from '@angular/core';
import { IconComponent } from '../../../components/ui/icon.component';

@Component({
  selector: 'admin-leave',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden min-h-[50vh]">
      <div class="flex flex-col items-center justify-center h-full py-32 px-6 text-center">
         <div class="w-20 h-20 bg-zinc-50 rounded-2xl flex items-center justify-center mb-6 text-zinc-400 shadow-sm border border-zinc-100">
            <app-icon name="calendar-days" size="40"/>
         </div>
         <h3 class="text-zinc-900 font-bold text-xl mb-1 tracking-tight">No Leave Requests</h3>
         <p class="text-zinc-500 max-w-xs mx-auto text-sm">There are no pending leave requests to review at this time.</p>
      </div>
    </div>
  `
})
export class AdminLeave { }
