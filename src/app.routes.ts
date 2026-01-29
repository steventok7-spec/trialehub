

import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // Auth Routes
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },

  // Employee Routes
  {
    path: 'employee',
    canActivate: [authGuard],
    data: { role: 'employee' },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/employee/dashboard.component').then(m => m.EmployeeDashboardComponent)
      },
      {
        path: 'attendance',
        loadComponent: () => import('./pages/employee/attendance.component').then(m => m.AttendanceComponent)
      },
      {
        path: 'requests',
        loadComponent: () => import('./pages/employee/requests.component').then(m => m.RequestsComponent)
      },
      {
        path: 'payroll',
        loadComponent: () => import('./pages/employee/payroll.component').then(m => m.PayrollComponent)
      },
      {
        path: 'schedule',
        loadComponent: () => import('./pages/employee/attendance.component').then(m => m.AttendanceComponent)
      }
    ]
  },

  // Owner/Admin Routes
  {
    path: 'admin',
    canActivate: [authGuard],
    data: { role: 'owner' },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/admin/dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'employees',
        loadComponent: () => import('./pages/admin/employees.component').then(m => m.EmployeesComponent)
      },
      {
        path: 'employees/:id',
        loadComponent: () => import('./pages/admin/employee-detail.component').then(m => m.EmployeeDetailComponent)
      },
      {
        path: 'scheduling',
        loadComponent: () => import('./pages/admin/scheduling.component').then(m => m.SchedulingComponent)
      },
      {
        path: 'payroll',
        loadComponent: () => import('./pages/admin/payroll.component').then(m => m.PayrollComponent)
      },
      {
        path: 'requests',
        loadComponent: () => import('./pages/admin/requests.component').then(m => m.RequestsComponent)
      }
    ]
  },

  // Catch all
  { path: '**', redirectTo: '/login' }
];
