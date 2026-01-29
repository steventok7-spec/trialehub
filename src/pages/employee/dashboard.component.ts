import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { HeaderComponent } from '../../components/layout/header.component';
import { CardComponent } from '../../components/ui/card.component';
import { IconComponent } from '../../components/ui/icon.component';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, CardComponent, IconComponent],
  template: `
    <div class="min-h-screen bg-stone-50">
      <app-header />
      
      <main class="max-w-7xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-black text-zinc-900 mb-2">Welcome back!</h1>
        <p class="text-zinc-600 mb-8">{{ authService.currentUser()?.name }}</p>

        <!-- Quick Actions Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <app-card 
            (click)="navigate('/employee/attendance')"
            class="cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <app-icon name="clock" size="24" class="text-blue-600" />
              </div>
              <div>
                <p class="text-sm text-zinc-600">Attendance</p>
                <p class="font-semibold text-zinc-900">Check In/Out</p>
              </div>
            </div>
          </app-card>

          <app-card 
            (click)="navigate('/employee/requests')"
            class="cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <app-icon name="file-text" size="24" class="text-green-600" />
              </div>
              <div>
                <p class="text-sm text-zinc-600">Requests</p>
                <p class="font-semibold text-zinc-900">Leave/Sick</p>
              </div>
            </div>
          </app-card>

          <app-card 
            (click)="navigate('/employee/payroll')"
            class="cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <app-icon name="receipt" size="24" class="text-purple-600" />
              </div>
              <div>
                <p class="text-sm text-zinc-600">Payroll</p>
                <p class="font-semibold text-zinc-900">View Summary</p>
              </div>
            </div>
          </app-card>

          <app-card 
            (click)="navigate('/employee/schedule')"
            class="cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <app-icon name="calendar" size="24" class="text-orange-600" />
              </div>
              <div>
                <p class="text-sm text-zinc-600">Schedule</p>
                <p class="font-semibold text-zinc-900">My Shifts</p>
              </div>
            </div>
          </app-card>
        </div>
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeDashboardComponent {
  authService = inject(AuthService);

  navigate(path: string): void {
    window.location.href = path;
  }
}
