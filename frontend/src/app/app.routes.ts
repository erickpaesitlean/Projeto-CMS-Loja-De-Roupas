import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { publicGuard } from './guards/public.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    canMatch: [publicGuard],
    loadComponent: () =>
      import('./pages/login/login.component').then(
        m => m.LoginComponent
      )
  },
  {
    path: '',
    canMatch: [authGuard],
    loadComponent: () =>
      import('./layout/app-shell/app-shell.component').then(m => m.AppShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(
            m => m.DashboardComponent
          )
      },
      {
        path: 'dashboard-diretor',
        loadComponent: () =>
          import('./pages/dashboard-diretor/dashboard-diretor.component').then(
            m => m.DashboardDiretorComponent
          )
      },
      {
        path: 'dashboard-gerente',
        loadComponent: () =>
          import('./pages/dashboard-gerente/dashboard-gerente.component').then(
            m => m.DashboardGerenteComponent
          )
      },
      {
        path: 'dashboard-conteudo',
        loadComponent: () =>
          import('./pages/dashboard-conteudo/dashboard-conteudo.component').then(
            m => m.DashboardConteudoComponent
          )
      },
      {
        path: 'categorias',
        loadComponent: () =>
          import('./pages/categories/categories-page/categories-page.component').then(
            m => m.CategoriesPageComponent
          ),
        children: [
          {
            path: 'nova',
            loadComponent: () =>
              import('./pages/categories/category-form/category-form.component').then(
                m => m.CategoryFormComponent
              )
          },
          {
            path: ':slug/editar',
            loadComponent: () =>
              import('./pages/categories/category-form/category-form.component').then(
                m => m.CategoryFormComponent
              )
          },
          {
            path: ':id/inativar',
            redirectTo: '/categorias'
          },
          {
            path: ':id/remover',
            redirectTo: '/categorias'
          }
        ]
      },
      {
        path: 'produtos',
        loadComponent: () =>
          import('./pages/products/products-page/products-page.component').then(
            m => m.ProductsPageComponent
          ),
        children: [
          {
            path: 'nova',
            loadComponent: () =>
              import('./pages/products/product-form/product-form.component').then(
                m => m.ProductFormComponent
              )
          },
          {
            path: ':id/editar',
            loadComponent: () =>
              import('./pages/products/product-form/product-form.component').then(
                m => m.ProductFormComponent
              )
          },
          {
            path: ':id/detalhes',
            loadComponent: () =>
              import('./pages/products/product-detail/product-detail.component').then(
                m => m.ProductDetailComponent
              )
          },
          {
            path: ':id/inativar',
            redirectTo: '/produtos'
          },
          {
            path: ':id/remover',
            redirectTo: '/produtos'
          }
        ]
      },
      {
        path: 'lojas',
        loadComponent: () =>
          import('./pages/stores/stores-page/stores-page.component').then(
            m => m.StoresPageComponent
          ),
        children: [
          {
            path: 'nova',
            loadComponent: () =>
              import('./pages/stores/store-form/store-form.component').then(
                m => m.StoreFormComponent
              )
          },
          {
            path: ':id/editar',
            loadComponent: () =>
              import('./pages/stores/store-form/store-form.component').then(
                m => m.StoreFormComponent
              )
          },
          {
            path: ':id/inativar',
            redirectTo: '/lojas'
          },
          {
            path: ':id/remover',
            redirectTo: '/lojas'
          }
        ]
      },
      {
        path: 'vitrine',
        loadComponent: () =>
          import('./pages/vitrine/vitrine.component').then(
            m => m.VitrineComponent
          )
      },
      {
        path: 'alertas/resolver/:type',
        loadComponent: () =>
          import('./pages/alertas-resolver/alertas-resolver.component').then(
            m => m.AlertasResolverComponent
          )
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
