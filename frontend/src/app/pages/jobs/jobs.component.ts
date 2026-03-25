import { AfterViewInit, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { JobsApiService } from '../../core/services/jobs-api.service';
import { Job } from '../../core/models/job.model';

type StatusFilter = 'all' | 'Open' | 'Closed';

@Component({
  selector: 'app-jobs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSortModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './jobs.component.html',
  styleUrl: './jobs.component.scss',
})
export class JobsComponent implements OnInit, AfterViewInit {
  private jobsApi = inject(JobsApiService);
  private snackBar = inject(MatSnackBar);

  displayedColumns: string[] = [
    'title',
    'description',
    'department',
    'location',
    'status',
    'candidates',
    'actions',
  ];
  dataSource = new MatTableDataSource<Job>([]);

  @ViewChild(MatSort) sort?: MatSort;
  @ViewChild(MatPaginator) paginator?: MatPaginator;

  /** Full list from API before client-side filters */
  private allJobs: Job[] = [];

  searchQuery = '';
  statusFilter: StatusFilter = 'all';
  loading = signal(false);
  loadError = signal('');

  get totalJobs(): number {
    return this.allJobs.length;
  }

  get openJobs(): number {
    return this.allJobs.filter((j) => j.status === 'Open').length;
  }

  get closedJobs(): number {
    return this.allJobs.filter((j) => j.status === 'Closed').length;
  }

  get emptyMessage(): string {
    if (this.loading()) return '';
    if (this.loadError()) return '';
    const data = this.dataSource.data;
    if (data.length === 0)
      return this.searchQuery || this.statusFilter !== 'all'
        ? 'No jobs match your filters. Try clearing filters.'
        : 'No jobs yet. Add your first job to get started.';
    return '';
  }

  ngOnInit(): void {
    this.loadFromServer();
  }

  ngAfterViewInit(): void {
    if (this.sort) this.dataSource.sort = this.sort;
    if (this.paginator) this.dataSource.paginator = this.paginator;
  }

  loadFromServer(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.jobsApi.list().subscribe({
      next: (jobs) => {
        this.allJobs = jobs;
        this.applyLocalFilters();
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const msg =
          err?.error?.error ?? err?.message ?? 'Could not load jobs. Is the backend running?';
        this.loadError.set(msg);
        this.allJobs = [];
        this.dataSource.data = [];
        this.snackBar.open(String(msg), 'Close', { duration: 5000 });
      },
    });
  }

  applyLocalFilters(): void {
    let list = [...this.allJobs];
    if (this.statusFilter !== 'all') {
      list = list.filter((j) => j.status === this.statusFilter);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      list = list.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          (j.description && j.description.toLowerCase().includes(q)) ||
          (j.department && j.department.toLowerCase().includes(q))
      );
    }
    this.dataSource.data = list;

    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  refresh(): void {
    this.applyLocalFilters();
  }

  onSearchChange(): void {
    this.applyLocalFilters();
  }

  onStatusFilterChange(): void {
    this.applyLocalFilters();
  }

  clearFilters(): void {
    if (!this.searchQuery && this.statusFilter === 'all') return;
    this.searchQuery = '';
    this.statusFilter = 'all';
    this.applyLocalFilters();
  }

  getCandidateCount(job: Job): number {
    return job.candidateCount ?? 0;
  }

  onCreateJobClick(): void {
    const title = prompt('Enter job title');
    if (!title?.trim()) return;

    const department = prompt('Enter department', 'Engineering')?.trim() || 'General';
    const location = prompt('Enter location', 'Remote')?.trim() || 'Remote';
    const description =
      prompt('Enter job description', 'New job posting')?.trim() || 'New job posting';

    this.jobsApi
      .create({
        title: title.trim(),
        department,
        location,
        description,
        status: 'Open',
      })
      .subscribe({
        next: () => {
          this.snackBar.open('Job created successfully.', 'Close', {
            duration: 2500,
            horizontalPosition: 'right',
            verticalPosition: 'top',
          });
          this.loadFromServer();
        },
        error: (err) => {
          const msg = err?.error?.error ?? 'Failed to create job (check role: hiring_manager or admin)';
          this.snackBar.open(msg, 'Close', { duration: 5000 });
        },
      });
  }

  editJob(job: Job): void {
    const title = prompt('Edit job title', job.title);
    if (!title?.trim()) return;

    const department = prompt('Edit department', job.department)?.trim() || job.department;
    const location = prompt('Edit location', job.location)?.trim() || job.location;
    const description = prompt('Edit description', job.description)?.trim() || job.description;

    this.jobsApi
      .update(job.id, {
        title: title.trim(),
        department,
        location,
        description,
        status: job.status,
      })
      .subscribe({
        next: () => {
          this.snackBar.open('Job updated successfully.', 'Close', {
            duration: 2500,
            horizontalPosition: 'right',
            verticalPosition: 'top',
          });
          this.loadFromServer();
        },
        error: (err) => {
          const msg = err?.error?.error ?? 'Failed to update job';
          this.snackBar.open(msg, 'Close', { duration: 5000 });
        },
      });
  }

  toggleJobStatus(job: Job): void {
    const newStatus: Job['status'] = job.status === 'Open' ? 'Closed' : 'Open';
    this.jobsApi
      .update(job.id, {
        title: job.title,
        department: job.department,
        location: job.location,
        description: job.description,
        status: newStatus,
      })
      .subscribe({
        next: () => {
          this.snackBar.open(`Job marked as ${newStatus}.`, 'Close', {
            duration: 2500,
            horizontalPosition: 'right',
            verticalPosition: 'top',
          });
          this.loadFromServer();
        },
        error: (err) => {
          const msg = err?.error?.error ?? 'Failed to update job status';
          this.snackBar.open(msg, 'Close', { duration: 5000 });
        },
      });
  }
}
