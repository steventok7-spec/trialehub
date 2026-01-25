
import { Component, input, output, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../components/ui/icon.component';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <aside
      class="bg-gradient-to-b from-[#1c1917] via-[#1a1714] to-[#1c1917] text-stone-300 flex flex-col transition-all duration-300 ease-in-out border-r-2 border-stone-800/80 shadow-2xl"
      [class.w-72]="!isCollapsed()"
      [class.w-20]="isCollapsed()"
    >
        <!-- Logo Area -->
        <div class="h-20 flex items-center shrink-0 border-b-2 border-stone-800/80 cursor-pointer group"
          [class.justify-center]="isCollapsed()"
          [class.px-6]="!isCollapsed()"
          (click)="selectTab('dashboard')"
        >
            <h2 class="text-xl font-bold text-white tracking-wider whitespace-nowrap group-hover:text-zinc-200 transition-colors">SUKHA</h2>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
            @for(item of navItems; track item.id) {
                <button (click)="selectTab(item.id)"
                    class="nav-button w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-left font-semibold transition-all duration-200 group relative"
                    [class.justify-center]="isCollapsed()"
                    [class.active]="activeTab() === item.id"
                    type="button"
                >
                    <div class="relative">
                      <app-icon [name]="item.icon" [size]="22" class="flex-shrink-0 transition-all duration-200" [class.text-white]="activeTab() === item.id"/>
                      @if(activeTab() === item.id && isCollapsed()) {
                        <div class="absolute -right-3 top-0 bottom-0 w-1.5 bg-white rounded-full"></div>
                      }
                    </div>

                    @if(!isCollapsed()) {
                      <span class="truncate text-[13px] font-bold tracking-wider uppercase">{{ item.label }}</span>
                      @if(activeTab() === item.id) {
                         <div class="ml-auto w-2 h-2 rounded-full bg-white"></div>
                      }
                    }

                    <!-- Tooltip for collapsed state -->
                    @if(isCollapsed()) {
                      <div class="absolute left-16 bg-stone-800 text-white text-sm font-semibold py-2 px-4 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 shadow-2xl border-2 border-stone-700">
                        {{ item.label }}
                      </div>
                    }
                </button>
            }
        </nav>

        <!-- Footer / Collapse Toggle -->
        <div class="p-4 border-t-2 border-stone-800/80 shrink-0">
            <button
                (click)="toggleCollapse.emit()"
                class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all duration-200 text-stone-500 hover:bg-stone-800/80 hover:text-stone-200 group active:scale-95"
                [class.justify-center]="isCollapsed()"
            >
                <app-icon [name]="toggleIcon()" [size]="22" class="shrink-0 transition-transform duration-200 group-hover:scale-110"/>
                @if(!isCollapsed()) {
                  <span class="text-[13px] font-bold tracking-wider uppercase">Collapse</span>
                }
            </button>
        </div>
    </aside>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    /* Navigation Button Styles */
    .nav-button {
      color: #a8a29e;
      position: relative;
    }

    .nav-button.active {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.1);
    }

    .nav-button:not(.active):hover {
      color: #e7e5e4;
      background-color: rgba(255, 255, 255, 0.08);
    }

    .nav-button:active {
      transform: scale(0.98);
    }

    /* Scrollbar */
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #57534e;
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #78716c;
    }
  `]
})
export class AdminSidebarComponent {
  activeTab = input.required<string>();
  isCollapsed = input(false);

  tabChange = output<string>();
  toggleCollapse = output<void>();

  toggleIcon = computed(() => this.isCollapsed() ? 'chevrons-right' : 'chevrons-left');

  navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    { id: 'employees', label: 'People Directory', icon: 'users' },
    { id: 'attendance', label: 'Attendance', icon: 'clock' },
    { id: 'payroll', label: 'Payroll', icon: 'receipt' },
    { id: 'leave', label: 'Leave Requests', icon: 'calendar-days' },
    { id: 'sick', label: 'Sick Reports', icon: 'heart-pulse' },
    { id: 'claims', label: 'Expenses', icon: 'receipt' },
  ];

  selectTab(tabId: string) {
    this.tabChange.emit(tabId);
  }
}
