
import { Component } from '@angular/core';
import { IconComponent } from '../../../components/ui/icon.component';

@Component({
  selector: 'admin-claims',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden min-h-[50vh]">
      <div class="flex flex-col items-center justify-center h-full py-32 px-6 text-center">
         <div class="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 text-amber-500 shadow-sm border border-amber-100">
            <app-icon name="receipt" size="40"/>
         </div>
         <h3 class="text-zinc-900 font-bold text-xl mb-1 tracking-tight">No Expense Claims</h3>
         <p class="text-zinc-500 max-w-xs mx-auto text-sm">No expense claims are currently pending approval.</p>
      </div>
    </div>
  `
})
export class AdminClaims { }
