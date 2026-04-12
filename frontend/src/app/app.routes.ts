import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AppLayoutComponent } from './layout/app-layout.component';
import { HomeRedirectComponent } from './pages/home-redirect/home-redirect.component';
import { authGuard } from './core/auth/auth.guard';
import { adminGuard } from './core/auth/admin.guard';
import { hiringOnlyGuard, candidateGuard } from './core/auth/candidate.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },
  { path: 'forgot-password', loadComponent: () => import('./pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'reset-password', loadComponent: () => import('./pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },
  {
    path: '',
    canActivate: [authGuard],
    component: AppLayoutComponent,
    children: [
      { path: '', component: HomeRedirectComponent },
      { path: 'dashboard', canActivate: [hiringOnlyGuard], component: DashboardComponent },
      {
        path: 'portal/jobs',
        canActivate: [candidateGuard],
        loadComponent: () =>
          import('./pages/candidate-portal/candidate-jobs-browse.component').then((m) => m.CandidateJobsBrowseComponent),
      },
      {
        path: 'portal/jobs/:id',
        canActivate: [candidateGuard],
        loadComponent: () =>
          import('./pages/candidate-portal/candidate-job-detail.component').then((m) => m.CandidateJobDetailComponent),
      },
      {
        path: 'portal/applications',
        canActivate: [candidateGuard],
        loadComponent: () =>
          import('./pages/candidate-portal/candidate-my-applications.component').then(
            (m) => m.CandidateMyApplicationsComponent
          ),
      },
      {
        path: 'candidates',
        canActivate: [hiringOnlyGuard],
        loadComponent: () =>
          import('./pages/candidates/candidates-overview.component').then(m => m.CandidatesOverviewComponent),
      },
      {
        path: 'jobs/:id/candidates',
        canActivate: [hiringOnlyGuard],
        loadComponent: () =>
          import('./pages/job-candidates/job-candidates.component').then(m => m.JobCandidatesComponent),
      },
      {
        path: 'jobs',
        canActivate: [hiringOnlyGuard],
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
