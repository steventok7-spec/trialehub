
import { Component } from '@angular/core';
import { IconComponent } from '../../../components/ui/icon.component';

@Component({
  selector: 'admin-sick',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden min-h-[50vh]">
      <div class="flex flex-col items-center justify-center h-full py-32 px-6 text-center">
         <div class="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 text-rose-500 shadow-sm border border-rose-100">
            <app-icon name="heart-pulse" size="40"/>
         </div>
         <h3 class="text-zinc-900 font-bold text-xl mb-1 tracking-tight">No Sick Reports</h3>
         <p class="text-zinc-500 max-w-xs mx-auto text-sm">There are no new sick leave reports submitted.</p>
      </div>
    </div>
  `
})
export class AdminSick { }
