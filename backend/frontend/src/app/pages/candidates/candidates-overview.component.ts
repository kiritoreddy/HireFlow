import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
  imports: [CommonModule, RouterModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './candidates-overview.component.html',
  styleUrls: ['./candidates-overview.component.scss'],
})
export class CandidatesOverviewComponent implements OnInit {
  private jobsApi = inject(JobsApiService);

  jobsWithCounts: JobWithCounts[] = [];
  loading = signal(true);
  loadError = signal(false);

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.jobsApi.getJobs().subscribe({
      next: (jobs) => {
        this.jobsWithCounts = jobs.map((job) => {
          const applied = job.appliedCount ?? 0;
          const interview = job.interviewCount ?? 0;
          const selected = job.selectedCount ?? 0;
          const rejected = job.rejectedCount ?? 0;
          const total =
            job.candidateCount ?? applied + interview + selected + rejected;
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
      error: () => {
        this.jobsWithCounts = [];
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }
}
