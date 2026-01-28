import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { supabase } from '../supabase.config';

export const authGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requiredRole = route.data['role'] as 'owner' | 'employee';

  try {
    // 1. Check Supabase session (single source of truth)
    const session = await authService.getSupabaseSession();

    if (!session) {
      console.warn('Auth guard: No Supabase session found');
      router.navigate(['/']);
      return false;
    }

    // 2. Fetch user profile from database to validate role
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', session.user.id)
      .single();

    if (error || !profile) {
      console.error('Auth guard: Failed to fetch profile', error);
      router.navigate(['/']);
      return false;
    }

    // 3. Validate role matches required role
    const userRole = profile.role === 'owner' ? 'owner' : 'employee';

    if (userRole !== requiredRole) {
      console.warn(`Auth guard: Role mismatch. Required: ${requiredRole}, User: ${userRole}`);

      // Redirect to appropriate dashboard
      if (userRole === 'owner') {
        router.navigate(['/admin/dashboard']);
      } else {
        router.navigate(['/employee/dashboard']);
      }
      return false;
    }

    // 4. Additional owner validation (single owner enforcement)
    if (requiredRole === 'owner') {
      if (profile.email !== 'steventok@sukhapku.com') {
        console.error('Auth guard: Owner access denied - not authorized owner email');
        router.navigate(['/']);
        return false;
      }
    }

    // All checks passed
    return true;

  } catch (error) {
    console.error('Auth guard error:', error);
    router.navigate(['/']);
    return false;
  }
};
