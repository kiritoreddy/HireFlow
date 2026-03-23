import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { JobDataService } from '../../core/services/job-data.service';
import { Job } from '../../core/models/job.model';

type JobFilter = 'All' | 'Open' | 'Closed';

@Component({
  selector: 'app-jobs',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  templateUrl: './jobs.component.html',
  styleUrl: './jobs.component.scss',
})
export class JobsComponent implements OnInit {
  private jobData = inject(JobDataService);
  private snackBar = inject(MatSnackBar);

  displayedColumns = ['title', 'department', 'location', 'status', 'candidates', 'updated', 'actions'];
  dataSource = new MatTableDataSource<Job>([]);

  allJobs: Job[] = [];
  searchTerm = '';
  selectedFilter: JobFilter = 'All';

  ngOnInit(): void {
    this.allJobs = this.jobData.getJobs();
    this.applyFilters();
  }

  refresh(): void {
    this.allJobs = this.jobData.getJobs();
    this.applyFilters();
  }

  setFilter(filter: JobFilter): void {
    this.selectedFilter = filter;
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase();

    this.dataSource.data = this.allJobs.filter((job) => {
      const matchesFilter =
        this.selectedFilter === 'All' || job.status === this.selectedFilter;

      const matchesSearch =
        !search ||
        job.title.toLowerCase().includes(search) ||
        (job.department ?? '').toLowerCase().includes(search);

      return matchesFilter && matchesSearch;
    });
  }

  onCreateJobClick(): void {
    this.snackBar.open(
      'Create Job will be enabled during backend integration.',
      'Close',
      {
        duration: 2500,
        horizontalPosition: 'right',
        verticalPosition: 'top',
      }
    );
  }

  getCandidateCount(jobId: number): number {
    const counts = this.jobData.getCandidateCountsByJob().get(jobId);
    if (!counts) {
      return 0;
    }

    return counts.applied + counts.interview + counts.selected + counts.rejected;
  }
}