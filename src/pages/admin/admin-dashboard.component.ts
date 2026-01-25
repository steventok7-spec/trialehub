
import { Component, OnInit, inject, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from '../../services/toast.service';
import { AuthService, AuthUser } from '../../auth/auth.service';
import { IconComponent } from '../../components/ui/icon.component';
import { AdminDashboardView } from './views/dashboard-view.component';
import { AdminEmployeesNew } from './views/employees-new.component';
import { AdminAttendance } from './views/attendance.component';
import { AdminLeave } from './views/leave.component';
import { AdminSick } from './views/sick.component';
import { AdminClaims } from './views/claims.component';
import { AdminPayrollComponent } from './views/payroll.component';
import { AdminSidebarComponent } from './sidebar.component';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    IconComponent,
    AdminSidebarComponent,
    AdminDashboardView,
    AdminEmployeesNew,
    AdminAttendance,
    AdminLeave,
    AdminSick,
    AdminClaims,
    AdminPayrollComponent
  ],
  template: `
    @if (admin) {
      <div class="min-h-screen w-full bg-stone-50 flex overflow-x-hidden">

        <!-- Desktop Sidebar (Fixed Layout) -->
        <app-admin-sidebar
          class="hidden md:flex flex-shrink-0 h-full z-30 relative border-r border-stone-200"
          [activeTab]="activeTab()"
          [isCollapsed]="isSidebarCollapsed()"
          (tabChange)="setActiveTab($event)"
          (toggleCollapse)="toggleSidebarCollapse()"
        />

        <!-- Main Content Wrapper -->
        <div class="flex-1 flex flex-col relative w-full">

          <!-- Sticky Header -->
          <header class="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-stone-200 px-6 py-5 flex items-center justify-between shrink-0 z-40">
            <div class="flex items-center gap-4 flex-1 min-w-0">

               <div class="min-w-0">
                 <h1 class="text-2xl font-black text-zinc-900 tracking-tight leading-none truncate">
                   {{ getPageTitle() }}
                 </h1>
                 <p class="text-[11px] font-black text-zinc-400 uppercase tracking-widest mt-1.5 hidden md:block">
                    Administrative Control Center
                 </p>
                 <p class="text-[11px] font-black text-zinc-400 uppercase tracking-widest mt-1.5 md:hidden">
                    Admin Portal
                 </p>
               </div>
            </div>

            <div class="flex items-center gap-3">
              <!-- Notification Bell -->
              <div class="relative" (click)="stopProp($event)">
                 <button 
                  (click)="toggleNotifications()"
                  class="p-2.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 rounded-xl transition-all relative group"
                 >
                    <app-icon name="bell" [size]="20" class="group-hover:rotate-12 transition-transform"/>
                    @if (notificationService.unreadCount() > 0) {
                      <span class="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                    }
                 </button>

                 <!-- Notification Dropdown -->
                 @if (showNotifications()) {
                   <div class="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-zinc-100 py-3 z-50 animate-scale-in origin-top-right overflow-hidden">
                      <div class="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                         <h3 class="text-sm font-black text-zinc-900 uppercase tracking-widest">Notifications</h3>
                         @if (notificationService.unreadCount() > 0) {
                           <button (click)="notificationService.markAllAsRead()" class="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700">
                             Clear all
                           </button>
                         }
                      </div>
                      
                      <div class="max-h-[60vh] overflow-y-auto custom-scrollbar">
                        @for (notif of notificationService.notifications(); track notif.id) {
                           <div 
                             class="px-5 py-4 hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0 cursor-pointer flex gap-4"
                             [class.bg-blue-50/30]="!notif.read"
                             (click)="notificationService.markAsRead(notif.id)"
                           >
                              <div class="w-10 h-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center text-xl shadow-sm">{{ notif.icon }}</div>
                              <div class="flex-1 min-w-0">
                                 <p class="text-sm font-bold text-zinc-900 truncate" [class.font-black]="!notif.read">{{ notif.title }}</p>
                                 <p class="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">{{ notif.message }}</p>
                                 <p class="text-[10px] font-bold text-zinc-400 mt-3 uppercase tracking-wider">{{ notif.timestamp | date:'shortTime' }} • {{ notif.timestamp | date:'mediumDate' }}</p>
                              </div>
                           </div>
                        } @empty {
                           <div class="py-16 text-center">
                              <div class="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-100 text-zinc-200"><app-icon name="bell-off" size="24"/></div>
                              <p class="text-xs font-bold text-zinc-400 uppercase tracking-widest">Quiet in here</p>
                           </div>
                        }
                      </div>
                   </div>
                 }
              </div>

              <!-- Profile Info (Desktop) -->
              <div class="hidden md:flex items-center gap-4 pl-4 border-l border-stone-200">
                <div class="text-right">
                  <p class="text-sm font-black text-zinc-900 tracking-tight leading-none">{{ admin!.name }}</p>
                  <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1.5">Administrator</p>
                </div>
                <div class="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-zinc-900/10">
                   {{ admin!.name.charAt(0) }}
                </div>
              </div>

              <!-- Logout Button -->
              <button
                (click)="handleLogout()"
                class="ml-2 p-2.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all group"
                title="Log out"
              >
                <app-icon name="log-out" [size]="20" class="group-hover:-translate-x-1 transition-transform"/>
              </button>
            </div>
          </header>

          <!-- Scrollable Content Area -->
          <main class="flex-1 overflow-x-hidden p-6 sm:p-8 lg:p-10 pb-36 md:pb-12 scroll-smooth w-full" (click)="showNotifications.set(false)">
            <div class="max-w-7xl mx-auto w-full animate-fade-in">
              @switch (activeTab()) {
                @case ('dashboard') { <admin-dashboard-view (navigate)="setActiveTab($event)" /> }
                @case ('employees') { <admin-employees-new /> }
                @case ('attendance') { <admin-attendance /> }
                @case ('leave') { <admin-leave /> }
                @case ('sick') { <admin-sick /> }
                @case ('claims') { <admin-claims /> }
                @case ('payroll') { <admin-payroll /> }
              }
            </div>
          </main>

          <!-- Mobile Bottom Navigation -->
          <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-50 pb-[env(safe-area-inset-bottom)]">
            <div class="flex h-16 w-full">

              <!-- Home Tab -->
              <button 
                type="button" 
                (click)="setActiveTab('dashboard')" 
                class="flex-1 flex flex-col items-center justify-center gap-1"
                [class.text-zinc-900]="activeTab() === 'dashboard'"
                [class.text-zinc-400]="activeTab() !== 'dashboard'"
              >
                <div 
                  class="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                  [class.bg-zinc-900]="activeTab() === 'dashboard'"
                  [class.text-white]="activeTab() === 'dashboard'"
                >
                  <app-icon name="layout-dashboard" [size]="20"/>
                </div>
                <span class="text-[10px] font-bold tracking-tight uppercase">HOME</span>
              </button>

              <!-- People Tab -->
              <button 
                type="button" 
                (click)="setActiveTab('employees')" 
                class="flex-1 flex flex-col items-center justify-center gap-1 transition-all"
                [class.text-zinc-900]="activeTab() === 'employees'"
                [class.text-zinc-400]="activeTab() !== 'employees'"
              >
                <div 
                  class="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                  [class.bg-zinc-900]="activeTab() === 'employees'"
                  [class.text-white]="activeTab() === 'employees'"
                >
                  <app-icon name="users" [size]="20"/>
                </div>
                <span class="text-[10px] font-bold tracking-tight uppercase">PEOPLE</span>
              </button>

              <!-- Time Tab -->
              <button 
                type="button" 
                (click)="setActiveTab('attendance')" 
                class="flex-1 flex flex-col items-center justify-center gap-1 transition-all"
                [class.text-zinc-900]="activeTab() === 'attendance'"
                [class.text-zinc-400]="activeTab() !== 'attendance'"
              >
                <div 
                  class="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                  [class.bg-zinc-900]="activeTab() === 'attendance'"
                  [class.text-white]="activeTab() === 'attendance'"
                >
                  <app-icon name="clock" [size]="20"/>
                </div>
                <span class="text-[10px] font-bold tracking-tight uppercase">TIME</span>
              </button>

              <!-- Pay Tab -->
              <button 
                type="button" 
                (click)="setActiveTab('payroll')" 
                class="flex-1 flex flex-col items-center justify-center gap-1 transition-all"
                [class.text-zinc-900]="activeTab() === 'payroll'"
                [class.text-zinc-400]="activeTab() !== 'payroll'"
              >
                <div 
                  class="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                  [class.bg-zinc-900]="activeTab() === 'payroll'"
                  [class.text-white]="activeTab() === 'payroll'"
                >
                  <app-icon name="receipt" [size]="20"/>
                </div>
                <span class="text-[10px] font-bold tracking-tight uppercase">PAY</span>
              </button>

              <!-- More Tab -->
              <button 
                type="button" 
                (click)="setActiveTab('leave')" 
                class="flex-1 flex flex-col items-center justify-center gap-1 transition-all"
                [class.text-zinc-900]="activeTab() === 'leave'"
                [class.text-zinc-400]="activeTab() !== 'leave'"
              >
                <div 
                  class="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                  [class.bg-zinc-900]="activeTab() === 'leave'"
                  [class.text-white]="activeTab() === 'leave'"
                >
                  <app-icon name="menu" [size]="20"/>
                </div>
                <span class="text-[10px] font-bold tracking-tight uppercase">MORE</span>
              </button>

            </div>
          </nav>
        </div>
      </div>
    } @else {
      <div class="min-h-screen w-full flex items-center justify-center bg-stone-50">
        <div class="flex flex-col items-center gap-4">
           <div class="w-10 h-10 border-3 border-stone-200 border-t-zinc-900 rounded-full animate-spin"></div>
           <p class="text-sm text-stone-600 font-medium">Loading Portal...</p>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .animate-fade-in {
      animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes scale-in {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-scale-in {
      animation: scale-in 0.1s ease-out forwards;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  admin: AuthUser | null = null;
  activeTab = signal<string>('dashboard');
  isSidebarCollapsed = signal(false);

  // Notifications
  public notificationService = inject(NotificationService);
  showNotifications = signal(false);

  toggleNotifications() {
    this.showNotifications.update(v => !v);
  }

  stopProp(e: Event) {
    e.stopPropagation();
  }


  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (!user || user.role !== 'admin') {
      this.toast.info('Please sign in as an admin to access that page.');
      this.router.navigate(['/']);
      return;
    }

    this.admin = user;

    // Use takeUntilDestroyed to prevent memory leaks
    this.route.queryParams.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(params => {
      const tab = params['tab'];
      if (tab && this.isValidTab(tab)) {
        this.activeTab.set(tab);
      }
    });

    this.loadSidebarPreference();
  }

  private isValidTab(tab: string): boolean {
    const validTabs = ['dashboard', 'employees', 'attendance', 'leave', 'sick', 'claims', 'payroll'];
    return validTabs.includes(tab);
  }

  private loadSidebarPreference(): void {
    try {
      const collapsedPref = localStorage.getItem('sidebarCollapsed');
      if (collapsedPref) {
        this.isSidebarCollapsed.set(JSON.parse(collapsedPref));
      }
    } catch {
      // Ignore parsing errors
    }
  }

  toggleSidebarCollapse(): void {
    const newValue = !this.isSidebarCollapsed();
    this.isSidebarCollapsed.set(newValue);
    try {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(newValue));
    } catch {
      // Ignore storage errors
    }
  }

  handleLogout(): void {
    this.authService.logout();
    this.toast.success('Logged out successfully');
  }

  setActiveTab(tabName: string): void {
    if (this.activeTab() === tabName) return;
    if (!this.isValidTab(tabName)) return;

    this.activeTab.set(tabName);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabName },
      queryParamsHandling: 'merge',
    });
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getPageTitle(): string {
    const tab = this.activeTab();
    const titles: Record<string, string> = {
      'dashboard': 'Dashboard',
      'employees': 'Directory',
      'attendance': 'Attendance',
      'leave': 'Requests',
      'sick': 'Sick Reports',
      'claims': 'Expenses',
      'payroll': 'Payroll'
    };
    return titles[tab] || 'Admin Portal';
  }
}
