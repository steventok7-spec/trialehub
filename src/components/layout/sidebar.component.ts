

import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { IconComponent } from '../ui/icon.component';

export interface SidebarItem {
  label: string;
  path: string;
  icon: string;
  roles?: ('owner' | 'employee')[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <aside class="hidden md:flex fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-zinc-200 overflow-y-auto">
      <nav class="flex-1 p-6 space-y-2">
        @for (item of visibleItems; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="bg-zinc-100 text-zinc-900 border-r-4 border-zinc-900"
            [routerLinkActiveOptions]="{ exact: false }"
            class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors rounded-lg"
          >
            <app-icon [name]="item.icon" size="20" />
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>
    </aside>

    <!-- Mobile Sidebar -->
    <aside
      *ngIf="isMobileOpen"
      class="fixed md:hidden inset-0 top-16 z-30 bg-white border-r border-zinc-200 w-64 overflow-y-auto"
      (click)="$event.stopPropagation()"
    >
      <nav class="p-6 space-y-2">
        @for (item of visibleItems; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="bg-zinc-100"
            [routerLinkActiveOptions]="{ exact: false }"
            class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors rounded-lg"
            (click)="closeMobileMenu()"
          >
            <app-icon [name]="item.icon" size="20" />
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>
    </aside>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  private authService = inject(AuthService);

  @Input() isMobileOpen = false;
  @Input() items: SidebarItem[] = [];

  get visibleItems(): SidebarItem[] {
    const userRole = this.authService.isOwner() ? 'owner' : 'employee';
    return this.items.filter(item => !item.roles || item.roles.includes(userRole));
  }

  closeMobileMenu(): void {
    this.isMobileOpen = false;
  }
}
