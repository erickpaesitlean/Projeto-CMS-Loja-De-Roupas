import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Bloqueia rotas protegidas quando não há autenticação válida.
 * Usa CanMatch para impedir inclusive o carregamento do componente.
 */
export const authGuard: CanMatchFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated() ? true : router.parseUrl('/login');
};



