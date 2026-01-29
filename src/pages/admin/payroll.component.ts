import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/layout/header.component';
import { CardComponent } from '../../components/ui/card.component';

@Component({
  selector: 'app-admin-payroll',
  standalone: true,
  imports: [CommonModule, HeaderComponent, CardComponent],
  template: `
    <div class="min-h-screen bg-stone-50">
      <app-header />
      
      <main class="max-w-7xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-black text-zinc-900 mb-2">Payroll Management</h1>
        
        <app-card>
          <p class="text-zinc-600">Payroll management feature coming soon...</p>
        </app-card>
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PayrollComponent {}
