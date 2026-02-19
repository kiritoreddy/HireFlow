import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AppLayoutComponent } from './layout/app-layout.component';
import { authGuard } from './core/auth/auth.guard';
import { adminGuard } from './core/auth/admin.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'forgot-password', loadComponent: () => import('./pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'reset-password', loadComponent: () => import('./pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },
  {
    path: '',
    canActivate: [authGuard],
    component: AppLayoutComponent,
    children: [
      { path: '', component: DashboardComponent },
      {
        path: 'candidates',
        loadComponent: () =>
          import('./pages/candidates/candidates-overview.component').then(m => m.CandidatesOverviewComponent),
      },
      {
        path: 'jobs/:id/candidates',
        loadComponent: () =>
          import('./pages/job-candidates/job-candidates.component').then(m => m.JobCandidatesComponent),
      },
      {
        path: 'jobs',
        loadComponent: () => import('./pages/jobs/jobs.component').then(m => m.JobsComponent),
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/users/users.component').then(m => m.UsersComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
