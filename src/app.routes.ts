import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { EmployeeDashboardComponent } from './pages/employee/employee-dashboard.component';
import { AdminDashboardComponent } from './pages/admin/admin-dashboard.component';
import { EmployeeDetailComponent } from './pages/admin/views/employee-detail.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { 
    path: 'employee/dashboard', 
    component: EmployeeDashboardComponent,
    canActivate: [authGuard],
    data: { role: 'employee' }
  },
  { 
    path: 'admin/dashboard', 
    component: AdminDashboardComponent,
    canActivate: [authGuard],
    data: { role: 'admin' }
  },
  { 
    path: 'admin/employee/:id', 
    component: EmployeeDetailComponent,
    canActivate: [authGuard],
    data: { role: 'admin' }
  },
  { path: '**', redirectTo: '' }
];