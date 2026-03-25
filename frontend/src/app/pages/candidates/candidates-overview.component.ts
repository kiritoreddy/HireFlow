import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { JobsApiService } from '../../core/services/jobs-api.service';
import { Job } from '../../core/models/job.model';

interface JobWithCounts extends Job {
  applied: number;
  interview: number;
  selected: number;
  rejected: number;
  total: number;
}

@Component({
  selector: 'app-candidates-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  templateUrl: './candidates-overview.component.html',
  styleUrls: ['./candidates-overview.component.scss'],
})
export class CandidatesOverviewComponent implements OnInit {
  private jobsApi = inject(JobsApiService);

  jobsWithCounts: JobWithCounts[] = [];
  loading = signal(false);
  error = signal('');

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set('');
    this.jobsApi.list().subscribe({
      next: (jobs) => {
        this.jobsWithCounts = jobs.map((job) => {
          const applied = job.appliedCount ?? 0;
          const interview = job.interviewCount ?? 0;
          const selected = job.selectedCount ?? 0;
          const rejected = job.rejectedCount ?? 0;
          const total = applied + interview + selected + rejected;
          return {
            ...job,
            applied,
            interview,
            selected,
            rejected,
            total,
          };
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(
          err?.error?.error ?? err?.message ?? 'Could not load jobs.'
        );
        this.jobsWithCounts = [];
      },
    });
  }
}
