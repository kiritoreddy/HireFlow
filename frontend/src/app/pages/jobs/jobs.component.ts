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

  searchQuery = '';
  statusFilter: StatusFilter = 'all';
  loading = signal(false);
  loadError = signal(false);

  /** Last successful fetch (source for local filters). */
  private allJobs: Job[] = [];

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
    const data = this.dataSource.data;
    if (data.length === 0)
      return this.loadError()
        ? 'Could not load jobs. Check that the backend is running and you are logged in.'
        : this.searchQuery || this.statusFilter !== 'all'
          ? 'No jobs match your filters. Try clearing filters.'
          : 'No jobs yet. Add your first job to get started.';
    return '';
  }

  ngOnInit(): void {
    this.loadFromApi();
  }

  ngAfterViewInit(): void {
    this.bindTableControls();
  }

  private bindTableControls(): void {
    if (this.sort) this.dataSource.sort = this.sort;
    if (this.paginator) this.dataSource.paginator = this.paginator;
  }

  loadFromApi(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.jobsApi.getJobs().subscribe({
      next: (jobs) => {
        this.allJobs = jobs;
        this.loading.set(false);
        this.applyLocalFilters();
        queueMicrotask(() => this.bindTableControls());
      },
      error: () => {
        this.allJobs = [];
        this.loading.set(false);
        this.loadError.set(true);
        this.applyLocalFilters();
        this.snackBar.open('Failed to load jobs.', 'Close', { duration: 4000 });
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
    if (this.paginator) this.paginator.firstPage();
  }

  refresh(): void {
    this.applyLocalFilters();
  }

  onSearchChange(): void {
    this.refresh();
  }

  onStatusFilterChange(): void {
    this.refresh();
  }

  clearFilters(): void {
    if (!this.searchQuery && this.statusFilter === 'all') return;
    this.searchQuery = '';
    this.statusFilter = 'all';
    this.refresh();
  }

  getCandidateCount(job: Job): number {
    if (job.candidateCount != null) return job.candidateCount;
    const a = job.appliedCount ?? 0;
    const b = job.interviewCount ?? 0;
    const c = job.selectedCount ?? 0;
    const d = job.rejectedCount ?? 0;
    return a + b + c + d;
  }

  private apiError(err: unknown, fallback: string): void {
    const e = err as { error?: { error?: string }; status?: number };
    const msg = e?.error?.error ?? (e?.status === 403 ? 'You do not have permission for this action.' : fallback);
    this.snackBar.open(msg, 'Close', { duration: 4000 });
  }

  onCreateJobClick(): void {
    const title = prompt('Enter job title');
    if (!title?.trim()) return;

    const department = prompt('Enter department', 'Engineering')?.trim() || 'General';
    const location = prompt('Enter location', 'Remote')?.trim() || 'Remote';
    const description =
      prompt('Enter job description', 'New job posting')?.trim() || 'New job posting';

    this.jobsApi
      .createJob({
        title: title.trim(),
        department,
        location,
        description,
        status: 'Open',
      })
      .subscribe({
        next: () => {
          this.snackBar.open('Job created successfully.', 'Close', { duration: 2500 });
          this.loadFromApi();
        },
        error: (err) => this.apiError(err, 'Failed to create job'),
      });
  }

  editJob(job: Job): void {
    const title = prompt('Edit job title', job.title);
    if (!title?.trim()) return;

    const department = prompt('Edit department', job.department)?.trim() || job.department;
    const location = prompt('Edit location', job.location)?.trim() || job.location;
    const description = prompt('Edit description', job.description)?.trim() || job.description;

    this.jobsApi
      .updateJob({
        ...job,
        title: title.trim(),
        department,
        location,
        description,
      })
      .subscribe({
        next: () => {
          this.snackBar.open('Job updated successfully.', 'Close', { duration: 2500 });
          this.loadFromApi();
        },
        error: (err) => this.apiError(err, 'Failed to update job'),
      });
  }

  toggleJobStatus(job: Job): void {
    const newStatus: Job['status'] = job.status === 'Open' ? 'Closed' : 'Open';
    this.jobsApi.updateJob({ ...job, status: newStatus }).subscribe({
      next: () => {
        this.snackBar.open(`Job marked as ${newStatus}.`, 'Close', { duration: 2500 });
        this.loadFromApi();
      },
      error: (err) => this.apiError(err, 'Failed to update job status'),
    });
  }
}
