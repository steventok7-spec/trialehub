import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/layout/header.component';
import { CardComponent } from '../../components/ui/card.component';

@Component({
  selector: 'app-admin-employees',
  standalone: true,
  imports: [CommonModule, HeaderComponent, CardComponent],
  template: `
    <div class="min-h-screen bg-stone-50">
      <app-header />
      
      <main class="max-w-7xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-black text-zinc-900 mb-2">Employees</h1>
        <p class="text-zinc-600 mb-8">Manage your employees</p>

        <app-card>
          <p class="text-zinc-600">Employees feature coming soon...</p>
        </app-card>
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeesComponent {}
