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
import { JobDataService } from '../../core/services/job-data.service';
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
  private jobData = inject(JobDataService);
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

  get totalJobs(): number {
    return this.jobData.getJobs().length;
  }

  get openJobs(): number {
    return this.jobData.getJobs().filter((j) => j.status === 'Open').length;
  }

  get closedJobs(): number {
    return this.jobData.getJobs().filter((j) => j.status === 'Closed').length;
  }

  get emptyMessage(): string {
    if (this.loading()) return '';
    const data = this.dataSource.data;
    if (data.length === 0)
      return this.searchQuery || this.statusFilter !== 'all'
        ? 'No jobs match your filters. Try clearing filters.'
        : 'No jobs yet. Add your first job to get started.';
    return '';
  }

  ngOnInit(): void {
    this.loading.set(true);
    this.refresh();
    this.loading.set(false);
  }

  ngAfterViewInit(): void {
    if (this.sort) this.dataSource.sort = this.sort;
    if (this.paginator) this.dataSource.paginator = this.paginator;
  }

  refresh(): void {
    let list = this.jobData.getJobs();
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

  getCandidateCount(jobId: number): number {
    const counts = this.jobData.getCandidateCountsByJob().get(jobId);
    if (!counts) return 0;
    return counts.applied + counts.interview + counts.selected + counts.rejected;
  }

  onCreateJobClick(): void {
    const title = prompt('Enter job title');
    if (!title?.trim()) return;

    const department = prompt('Enter department', 'Engineering')?.trim() || 'General';
    const location = prompt('Enter location', 'Remote')?.trim() || 'Remote';
    const description =
      prompt('Enter job description', 'New job posting')?.trim() || 'New job posting';

    this.jobData.addJob({
      title: title.trim(),
      department,
      location,
      description,
      status: 'Open',
    });

    this.refresh();
    this.snackBar.open('Job created successfully.', 'Close', {
      duration: 2500,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  editJob(job: Job): void {
    const title = prompt('Edit job title', job.title);
    if (!title?.trim()) return;

    const department = prompt('Edit department', job.department)?.trim() || job.department;
    const location = prompt('Edit location', job.location)?.trim() || job.location;
    const description = prompt('Edit description', job.description)?.trim() || job.description;

    this.jobData.updateJob(job.id, {
      title: title.trim(),
      department,
      location,
      description,
    });

    this.refresh();
    this.snackBar.open('Job updated successfully.', 'Close', {
      duration: 2500,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  toggleJobStatus(job: Job): void {
    const newStatus: Job['status'] = job.status === 'Open' ? 'Closed' : 'Open';
    this.jobData.setJobStatus(job.id, newStatus);
    this.refresh();
    this.snackBar.open(`Job marked as ${newStatus}.`, 'Close', {
      duration: 2500,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}
