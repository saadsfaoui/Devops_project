import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

export const adminGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = await authService.waitForAuthState();

  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  // Check if user email matches admin email from environment
  if (user.email === environment.adminEmail) {
    return true;
  } else {
    router.navigate(['/']);
    return false;
  }
};
