import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AppLayoutComponent } from './layout/app-layout.component';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    canActivate: [authGuard],
    component: AppLayoutComponent,
    children: [
      { path: '', component: DashboardComponent },
      { path: 'candidates', loadComponent: () => import('./pages/candidates/candidates.component').then(m => m.CandidatesComponent) },
      { path: 'jobs', loadComponent: () => import('./pages/jobs/jobs.component').then(m => m.JobsComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];
