
import { Component, OnInit, inject, signal, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import { IconComponent } from '../../../components/ui/icon.component';
import { AddEditEmployeeFormComponent } from '../modals/add-edit-employee-form.component';
import { ScheduleEmployeeModalComponent } from '../modals/schedule-employee-modal.component';
import { ConfirmationModalComponent } from '../../../components/ui/confirmation-modal.component';
import { Employee } from '../../../models';

@Component({
  selector: 'admin-employees-new',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IconComponent,
    AddEditEmployeeFormComponent,
    ScheduleEmployeeModalComponent,
    ConfirmationModalComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Actions Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h3 class="font-bold text-xl text-zinc-800">Directory</h3>
           <p class="text-sm text-zinc-500 font-medium mt-1">
             @if (loading()) {
               Loading employees...
             } @else {
               {{ sortedEmployees().length }} Active Employees
             }
           </p>
        </div>
        
        <!-- Add Button (Triggers In-App Modal) -->
        <button type="button" (click)="openAddModal()" class="w-full sm:w-auto px-6 py-3 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2 shadow-sm">
          <app-icon name="user" size="18"/>
          <span>Add Person</span>
        </button>
      </div>
      
      <!-- Mobile View: Cards -->
      <div class="md:hidden space-y-4">
        @if (loading()) {
          <div class="text-center py-16 text-zinc-400 bg-stone-50 rounded-xl border border-dashed border-stone-200">
            <div class="w-8 h-8 mx-auto border-2 border-stone-200 border-t-zinc-900 rounded-full animate-spin mb-3"></div>
            Loading employees...
          </div>
        } @else {
        @for (employee of sortedEmployees(); track employee.id) {
          <div class="bg-white p-5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-stone-200">
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-900 font-black text-lg border border-zinc-200">
                  {{ (employee.name || '?').charAt(0) }}
                </div>
                <div>
                  <h4 class="font-bold text-zinc-900 text-lg leading-tight">{{ employee.name }}</h4>
                  <p class="text-sm text-zinc-500 font-medium mt-0.5">{{ employee.role }}</p>
                </div>
              </div>
              
              <div class="relative action-menu-container">
                 <button 
                  (click)="toggleActionMenu($event, employee.id)"
                  class="p-2 -mr-2 text-zinc-400 hover:text-zinc-900 active:bg-zinc-50 rounded-full transition-colors"
                >
                  <app-icon name="more-horizontal" size="24"/>
                </button>
                 @if (openActionMenuId() === employee.id) {
                   <!-- Mobile Menu Dropdown -->
                    <div class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl z-20 border border-stone-100 overflow-hidden animate-scale-in origin-top-right">
                        <button (click)="handleAction('edit', employee)" class="w-full text-left px-5 py-4 text-sm font-medium text-zinc-700 active:bg-stone-50 flex items-center gap-3 border-b border-stone-50">
                            <app-icon name="edit" size="18" class="text-zinc-400"/>
                            <span>Edit Profile</span>
                        </button>
                        <button (click)="handleAction('schedule', employee)" class="w-full text-left px-5 py-4 text-sm font-medium text-zinc-700 active:bg-stone-50 flex items-center gap-3 border-b border-stone-50">
                            <app-icon name="calendar" size="18" class="text-zinc-400"/>
                            <span>Set Schedule</span>
                        </button>
                        <a [routerLink]="['/admin/employee', employee.id]" (click)="closeActionMenu()" class="w-full text-left px-5 py-4 text-sm font-medium text-zinc-700 active:bg-stone-50 flex items-center gap-3 border-b border-stone-50">
                            <app-icon name="eye" size="18" class="text-zinc-400"/>
                            <span>View Details</span>
                        </a>
                        <button (click)="handleAction('delete', employee)" class="w-full text-left px-5 py-4 text-sm font-bold text-red-600 active:bg-red-50 flex items-center gap-3 bg-red-50/30">
                            <app-icon name="trash" size="18" class="text-red-500"/>
                            <span>Delete</span>
                        </button>
                    </div>
                }
              </div>
            </div>
            
            <div class="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center">
              <div>
                <span class="text-xs text-zinc-400 font-bold uppercase tracking-wider">Salary</span>
                <p class="text-sm font-semibold text-zinc-800 font-mono mt-0.5">{{ employee.salary | currency:'USD':'symbol':'1.0-0' }}</p>
              </div>
              <span class="px-3 py-1 bg-stone-100 text-zinc-600 text-xs font-bold rounded-full">{{ employee.status || 'Active' }}</span>
            </div>
          </div>
        } @empty {
          <div class="text-center py-12 text-zinc-400 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
            No employees found.
          </div>
        }
        }
      </div>

      <!-- Desktop View: Table -->
      <div class="hidden md:block bg-white rounded-2xl shadow-sm border border-stone-200">
        <div class="overflow-x-auto overflow-y-visible">
          <table class="w-full text-sm text-left text-zinc-500">
            <thead class="text-xs text-zinc-700 uppercase bg-stone-50 border-b border-stone-200">
              <tr>
                <th scope="col" class="px-6 py-5 font-bold">
                  <button (click)="handleSort('name')" class="flex items-center gap-2 group hover:text-zinc-900 transition-colors">
                    <span>Name</span>
                    @if (sortColumn() === 'name') {
                      <app-icon [name]="sortDirection() === 'asc' ? 'arrow-up' : 'arrow-down'" size="14" class="text-zinc-900"/>
                    } @else {
                      <app-icon name="chevrons-up-down" size="14" class="text-zinc-300 group-hover:text-zinc-900"/>
                    }
                  </button>
                </th>
                <th scope="col" class="px-6 py-5 font-bold">
                  <button (click)="handleSort('role')" class="flex items-center gap-2 group hover:text-zinc-900 transition-colors">
                    <span>Role</span>
                    @if (sortColumn() === 'role') {
                      <app-icon [name]="sortDirection() === 'asc' ? 'arrow-up' : 'arrow-down'" size="14" class="text-zinc-900"/>
                    } @else {
                      <app-icon name="chevrons-up-down" size="14" class="text-zinc-300 group-hover:text-zinc-900"/>
                    }
                  </button>
                </th>
                <th scope="col" class="px-6 py-5 font-bold">
                  <button (click)="handleSort('salary')" class="flex items-center gap-2 group hover:text-zinc-900 transition-colors">
                    <span>Salary</span>
                     @if (sortColumn() === 'salary') {
                      <app-icon [name]="sortDirection() === 'asc' ? 'arrow-up' : 'arrow-down'" size="14" class="text-zinc-900"/>
                    } @else {
                      <app-icon name="chevrons-up-down" size="14" class="text-zinc-300 group-hover:text-zinc-900"/>
                    }
                  </button>
                </th>
                <th scope="col" class="px-6 py-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100">
              @if (loading()) {
                <tr>
                  <td colspan="4" class="text-center py-20 text-zinc-400">
                    <div class="w-8 h-8 mx-auto border-2 border-stone-200 border-t-zinc-900 rounded-full animate-spin mb-3"></div>
                    Loading employees...
                  </td>
                </tr>
              } @else {
              @for (employee of sortedEmployees(); track employee.id) {
                <tr class="hover:bg-stone-50 transition-colors group">
                  <td class="px-6 py-4 font-medium text-zinc-900">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 rounded-full bg-zinc-100 text-zinc-900 flex items-center justify-center text-sm font-bold border border-zinc-200">
                        {{ (employee.name || '?').charAt(0) }}
                      </div>
                      {{ employee.name }}
                    </div>
                  </td>
                  <td class="px-6 py-4">{{ employee.role }}</td>
                  <td class="px-6 py-4 font-mono text-zinc-600">{{ employee.salary | currency:'USD':'symbol':'1.0-0' }}</td>
                  <td class="px-6 py-4">
                    <div class="flex justify-end relative action-menu-container-desktop">
                      <button 
                          (click)="toggleActionMenu($event, 'desktop-' + employee.id)" 
                          class="p-2 text-zinc-300 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Actions"
                      >
                          <app-icon name="more-horizontal" size="20"/>
                      </button>
                      @if (openActionMenuId() === 'desktop-' + employee.id) {
                          <div class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl z-10 border border-stone-100 animate-scale-in origin-top-right">
                              <div class="py-1">
                                  <button (click)="handleAction('edit', employee)" class="w-full text-left px-5 py-3 text-sm font-medium text-zinc-600 hover:bg-stone-50 flex items-center gap-3">
                                      <app-icon name="edit" size="16" class="text-zinc-400"/>
                                      <span>Edit Profile</span>
                                  </button>
                                  <button (click)="handleAction('schedule', employee)" class="w-full text-left px-5 py-3 text-sm font-medium text-zinc-600 hover:bg-stone-50 flex items-center gap-3">
                                      <app-icon name="calendar" size="16" class="text-zinc-400"/>
                                      <span>Set Schedule</span>
                                  </button>
                                  <a [routerLink]="['/admin/employee', employee.id]" (click)="closeActionMenu()" class="w-full text-left px-5 py-3 text-sm font-medium text-zinc-600 hover:bg-stone-50 flex items-center gap-3">
                                      <app-icon name="eye" size="16" class="text-zinc-400"/>
                                      <span>View Details</span>
                                  </a>
                                  <div class="border-t border-stone-100 my-1"></div>
                                  <button (click)="handleAction('delete', employee)" class="w-full text-left px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-3">
                                      <app-icon name="trash" size="16" class="text-red-500"/>
                                      <span>Delete Employee</span>
                                  </button>
                              </div>
                          </div>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="text-center py-20 text-zinc-400">No employees found.</td>
                </tr>
              }
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modals -->
    @if (showAddEditModal()) {
      <app-add-edit-employee-form 
        [employeeData]="selectedEmployee()"
        (close)="closeModals()"
        (save)="handleSaveEmployee($event)"
      />
    }

    @if (showScheduleModal()) {
      <app-schedule-employee-modal
        [employee]="selectedEmployee()"
        (close)="closeModals()"
        (save)="handleSaveSchedule($event)"
      />
    }

    @if (showDeleteConfirmation()) {
      <app-confirmation-modal
        title="Delete Employee"
        [message]="'Are you sure you want to delete ' + selectedEmployee()?.name + '? This action cannot be undone.'"
        (confirm)="handleDeleteEmployee()"
        (cancel)="closeModals()"
      />
    }
  `,
  styles: [`
    @keyframes scale-in {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-scale-in {
      animation: scale-in 0.1s ease-out forwards;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  }
})
export class AdminEmployeesNew implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  employees = signal<Employee[]>([]);
  loading = signal(true);
  showAddEditModal = signal(false);
  showScheduleModal = signal(false);
  showDeleteConfirmation = signal(false);
  selectedEmployee = signal<Employee | null>(null);
  openActionMenuId = signal<string | null>(null);

  sortColumn = signal<'name' | 'role' | 'salary' | null>('name');
  sortDirection = signal<'asc' | 'desc'>('asc');

  sortedEmployees = computed(() => {
    const employeesList = [...this.employees()];
    const column = this.sortColumn();
    const direction = this.sortDirection();

    if (!column) {
      return employeesList;
    }

    return employeesList.sort((a, b) => {
      const aValue = a[column as keyof Pick<Employee, 'name' | 'role' | 'salary'>];
      const bValue = b[column as keyof Pick<Employee, 'name' | 'role' | 'salary'>];

      const modifier = direction === 'asc' ? 1 : -1;

      if (aValue < bValue) {
        return -1 * modifier;
      }
      if (aValue > bValue) {
        return 1 * modifier;
      }
      return 0;
    });
  });

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.loading.set(true);
    this.api.getEmployees().subscribe({
      next: (data) => {
        this.employees.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Unable to load employees.');
        this.employees.set([]);
        this.loading.set(false);
      }
    });
  }

  closeModals() {
    this.showAddEditModal.set(false);
    this.showScheduleModal.set(false);
    this.showDeleteConfirmation.set(false);
    this.selectedEmployee.set(null);
  }

  openAddModal() {
    this.selectedEmployee.set(null);
    this.showAddEditModal.set(true);
  }

  openEditModal(employee: Employee) {
    this.selectedEmployee.set(employee);
    this.showAddEditModal.set(true);
  }

  openScheduleModal(employee: Employee) {
    this.selectedEmployee.set(employee);
    this.showScheduleModal.set(true);
  }

  confirmDelete(employee: Employee) {
    this.selectedEmployee.set(employee);
    this.showDeleteConfirmation.set(true);
  }

  handleSaveEmployee(employeeData: Employee) {
    const apiCall = employeeData.id
      ? this.api.updateEmployee(employeeData)
      : this.api.addEmployee(employeeData);

    apiCall.subscribe(res => {
      if (res.success) {
        this.toast.success(`Employee ${employeeData.id ? 'updated' : 'added'} successfully!`);
        this.loadEmployees();
        this.closeModals();
      } else {
        this.toast.error(res.error || 'Failed to save employee.');
      }
    });
  }

  handleDeleteEmployee() {
    if (!this.selectedEmployee()) return;
    this.api.deleteEmployee(this.selectedEmployee()!.id).subscribe(res => {
      if (res.success) {
        this.toast.success('Employee deleted successfully!');
        this.loadEmployees();
      } else {
        this.toast.error(res.error || 'Failed to delete employee.');
      }
      this.closeModals();
    });
  }

  handleSaveSchedule(scheduleData: { employeeId: string, schedule: any }) {
    this.api.updateSchedule(scheduleData).subscribe(res => {
      if (res.success) {
        this.toast.success('Schedule updated successfully!');
        this.loadEmployees();
        this.closeModals();
      } else {
        this.toast.error(res.error || 'Failed to update schedule.');
      }
    });
  }

  toggleActionMenu(event: MouseEvent, id: string) {
    event.stopPropagation();
    this.openActionMenuId.update(currentId => currentId === id ? null : id);
  }

  closeActionMenu() {
    this.openActionMenuId.set(null);
  }

  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    // Check both mobile and desktop containers
    if (target && !target.closest('.action-menu-container') && !target.closest('.action-menu-container-desktop')) {
      this.closeActionMenu();
    }
  }

  handleAction(action: 'edit' | 'schedule' | 'delete', employee: Employee) {
    this.closeActionMenu();
    switch (action) {
      case 'edit':
        this.openEditModal(employee);
        break;
      case 'schedule':
        this.openScheduleModal(employee);
        break;
      case 'delete':
        this.confirmDelete(employee);
        break;
    }
  }

  handleSort(column: 'name' | 'role' | 'salary') {
    if (this.sortColumn() === column) {
      this.sortDirection.update(dir => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }
}
