

import { Component, Input, Output, EventEmitter, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { ButtonComponent } from '../ui/button.component';
import { IconComponent } from '../ui/icon.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonComponent, IconComponent],
  template: `
    <header class="bg-white border-b border-zinc-200 sticky top-0 z-40 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <div class="flex-shrink-0 font-bold text-xl text-zinc-900">
            SUKHA Hub
          </div>

          <!-- Desktop Nav -->
          <div class="hidden md:flex items-center gap-8">
            @if (authService.isOwner()) {
              <a routerLink="/admin/dashboard" class="text-zinc-600 hover:text-zinc-900 font-medium transition-colors">
                Dashboard
              </a>
              <a routerLink="/admin/employees" class="text-zinc-600 hover:text-zinc-900 font-medium transition-colors">
                Employees
              </a>
            }
            @if (authService.isEmployee()) {
              <a routerLink="/employee/dashboard" class="text-zinc-600 hover:text-zinc-900 font-medium transition-colors">
                Dashboard
              </a>
              <a routerLink="/employee/attendance" class="text-zinc-600 hover:text-zinc-900 font-medium transition-colors">
                Attendance
              </a>
            }
          </div>

          <!-- Right Actions -->
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 text-sm">
              <span class="text-zinc-600">{{ authService.currentUser()?.name }}</span>
              @if (authService.isOwner()) {
                <span class="px-2 py-1 bg-zinc-100 text-zinc-700 rounded text-xs font-semibold">
                  Owner
                </span>
              }
            </div>

            <app-button
              variant="ghost"
              size="sm"
              (clicked)="onLogout()"
              [isLoading]="isLoggingOut"
            >
              <app-icon name="log-out" size="20" />
            </app-button>

            <button
              (click)="toggleMobileMenu()"
              class="md:hidden p-2 text-zinc-600 hover:text-zinc-900 transition-colors"
              aria-label="Toggle menu"
            >
              <app-icon name="menu" size="24" />
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  authService = inject(AuthService);
  @Input() isLoggingOut = false;
  @Output() mobileMenuToggled = new EventEmitter<void>();

  async onLogout(): Promise<void> {
    await this.authService.logout();
  }

  toggleMobileMenu(): void {
    this.mobileMenuToggled.emit();
  }
}
