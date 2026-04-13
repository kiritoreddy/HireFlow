import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { JobsApiService } from '../../core/services/jobs-api.service';
import { Job } from '../../core/models/job.model';

@Component({
  selector: 'app-candidate-jobs-browse',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './candidate-jobs-browse.component.html',
  styleUrl: './candidate-jobs-browse.component.scss',
})
export class CandidateJobsBrowseComponent implements OnInit {
  private jobsApi = inject(JobsApiService);

  loading = signal(true);
  loadError = signal(false);
  searchQuery = '';
  /** Open jobs only, client-side search */
  openJobs: Job[] = [];
  filteredJobs: Job[] = [];

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.jobsApi.getJobs().subscribe({
      next: (jobs) => {
        this.openJobs = jobs.filter((j) => j.status === 'Open');
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => {
        this.openJobs = [];
        this.filteredJobs = [];
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  private applyFilter(): void {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      this.filteredJobs = [...this.openJobs];
      return;
    }
    this.filteredJobs = this.openJobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        (j.description && j.description.toLowerCase().includes(q)) ||
        (j.department && j.department.toLowerCase().includes(q)) ||
        (j.location && j.location.toLowerCase().includes(q))
    );
  }
}
