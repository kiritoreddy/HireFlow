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
    this.refresh();
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
    const title = prompt('Enter job title');
    if (!title?.trim()) return;

    const department = prompt('Enter department', 'Engineering')?.trim() || 'General';
    const location = prompt('Enter location', 'Remote')?.trim() || 'Remote';
    const description = prompt('Enter job description', 'New job posting')?.trim() || 'New job posting';

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

    this.snackBar.open(
      `Job marked as ${newStatus}.`,
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