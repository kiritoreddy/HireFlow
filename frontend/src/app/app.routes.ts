import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },

  {
    path: 'candidates',
    loadComponent: () =>
      import('./pages/candidates/candidates-overview.component')
        .then(m => m.CandidatesOverviewComponent),
  },

  {
    path: 'jobs/:id/candidates',
    loadComponent: () =>
      import('./pages/job-candidates/job-candidates.component')
        .then(m => m.JobCandidatesComponent),
  },

  {
    path: 'jobs',
    loadComponent: () =>
      import('./pages/jobs/jobs.component')
        .then(m => m.JobsComponent),
  },
];
