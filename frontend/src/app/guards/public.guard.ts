import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard para rotas públicas (ex: /login).
 * Se o usuário já estiver autenticado, redireciona para o dashboard.
 */
export const publicGuard: CanMatchFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated() ? router.parseUrl('/dashboard') : true;
};



