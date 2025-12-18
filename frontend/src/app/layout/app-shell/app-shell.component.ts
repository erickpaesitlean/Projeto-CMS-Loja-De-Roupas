import { Component, OnDestroy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { IconComponent } from '../../shared/icons/icon.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly destroy$ = new Subject<void>();

  sidebarOpen = signal(false);
  private currentUrl = signal<string>('');

  pageLabel = computed(() => {
    const url = this.currentUrl();
    if (url.startsWith('/produtos')) return 'Produtos';
    if (url.startsWith('/categorias')) return 'Categorias';
    if (url.startsWith('/lojas')) return 'Lojas';
    if (url.startsWith('/vitrine')) return 'Vitrine';
    if (url.startsWith('/alertas')) return 'Alertas';
    return 'Dashboard';
  });

  ngOnInit(): void {
    this.currentUrl.set(this.router.url);
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe((e) => {
        this.currentUrl.set(e.urlAfterRedirects);
        // Ao navegar, fecha o menu no mobile
        this.sidebarOpen.set(false);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  logout(): void {
    this.closeSidebar();
    this.authService.logout();
  }
}


