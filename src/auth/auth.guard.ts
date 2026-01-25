import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requiredRole = route.data['role'];

  if (authService.isLoggedIn() && authService.hasRole(requiredRole)) {
    return true;
  }

  router.navigate(['/']);
  return false;
};
