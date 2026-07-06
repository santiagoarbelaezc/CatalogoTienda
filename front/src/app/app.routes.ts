import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  // ─── Public Catalog ────────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./pages/catalog/catalog-page.component').then(m => m.CatalogPageComponent)
  },

  // ─── Admin Login ───────────────────────────────────────
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./pages/admin/login/login-page.component').then(m => m.LoginPageComponent)
  },

  // ─── Admin Shell (protected) ───────────────────────────
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/admin-shell/admin-shell.component').then(m => m.AdminShellComponent),
    children: [
      // Default redirect to dashboard
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // Dashboard
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/admin/dashboard/dashboard-page.component').then(m => m.DashboardPageComponent)
      },

      // Products list
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/admin/products/products-page.component').then(m => m.ProductsPageComponent)
      },

      // New product
      {
        path: 'products/new',
        loadComponent: () =>
          import('./pages/admin/products/product-form/product-form.component').then(m => m.ProductFormComponent)
      },

      // Edit product
      {
        path: 'products/:id/edit',
        loadComponent: () =>
          import('./pages/admin/products/product-form/product-form.component').then(m => m.ProductFormComponent)
      },

      // Categories
      {
        path: 'categories',
        loadComponent: () =>
          import('./pages/admin/categories/categories-page.component').then(m => m.CategoriesPageComponent)
      },

      // Brands
      {
        path: 'brands',
        loadComponent: () =>
          import('./pages/admin/brands/brands-page.component').then(m => m.BrandsPageComponent)
      },

      // Analytics
      {
        path: 'analytics',
        loadComponent: () =>
          import('./pages/admin/analytics/analytics-page.component').then(m => m.AnalyticsPageComponent)
      },

      // Reports
      {
        path: 'reports',
        loadComponent: () =>
          import('./pages/admin/reports/reports-page.component').then(m => m.ReportsPageComponent)
      },
    ]
  },

  // ─── Wildcard ──────────────────────────────────────────
  { path: '**', redirectTo: '' }
];
