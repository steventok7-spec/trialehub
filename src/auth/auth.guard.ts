import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requiredRole = route.data['role'] as 'owner' | 'employee' | undefined;

  const user = authService.currentUser();

  // Not authenticated
  if (!user) {
    router.navigate(['/']);
    return false;
  }

  // Role check
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to appropriate dashboard
    if (user.role === 'owner') {
      router.navigate(['/owner/dashboard']);
    } else {
      router.navigate(['/employee/dashboard']);
    }
    return false;
  }

  return true;
};
