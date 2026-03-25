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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { JobsApiService } from '../../core/services/jobs-api.service';
import { Job } from '../../core/models/job.model';
import { JobFormDialogComponent, JobFormValue } from './job-form-dialog/job-form-dialog.component';

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
    MatDialogModule,
  ],
  templateUrl: './jobs.component.html',
  styleUrl: './jobs.component.scss',
})
export class JobsComponent implements OnInit, AfterViewInit {
  private jobsApi = inject(JobsApiService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

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

  private sort?: MatSort;
  private paginator?: MatPaginator;

  @ViewChild(MatSort) set matSort(value: MatSort | undefined) {
    this.sort = value;
    this.bindTableControls();
  }

  @ViewChild(MatPaginator) set matPaginator(value: MatPaginator | undefined) {
    this.paginator = value;
    this.bindTableControls();
  }

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
    const ref = this.dialog.open(JobFormDialogComponent, {
      width: '640px',
      maxWidth: '95vw',
      disableClose: true,
      data: {},
    });

    ref.afterClosed().subscribe((value?: JobFormValue) => {
      if (!value) return;
      this.jobsApi.createJob(value).subscribe({
        next: () => {
          this.snackBar.open('Job created successfully.', 'Close', { duration: 2500 });
          this.loadFromApi();
        },
        error: (err) => this.apiError(err, 'Failed to create job'),
      });
    });
  }

  editJob(job: Job): void {
    const ref = this.dialog.open(JobFormDialogComponent, {
      width: '640px',
      maxWidth: '95vw',
      disableClose: true,
      data: { job },
    });

    ref.afterClosed().subscribe((value?: JobFormValue) => {
      if (!value) return;
      this.jobsApi
        .updateJob({
          ...job,
          ...value,
        })
        .subscribe({
          next: () => {
            this.snackBar.open('Job updated successfully.', 'Close', { duration: 2500 });
            this.loadFromApi();
          },
          error: (err) => this.apiError(err, 'Failed to update job'),
        });
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
