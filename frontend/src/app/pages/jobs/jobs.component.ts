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
import { JobDataService } from '../../core/services/job-data.service';
import { Job } from '../../core/models/job.model';

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
  ],
  templateUrl: './jobs.component.html',
  styleUrl: './jobs.component.scss',
})
export class JobsComponent implements OnInit {
  private jobData = inject(JobDataService);

  displayedColumns = ['title', 'department', 'location', 'status', 'candidates', 'updated', 'actions'];
  dataSource = new MatTableDataSource<Job>([]);
  searchTerm = '';

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.dataSource.data = this.jobData.getJobs();
  }

  getCandidateCount(jobId: number): number {
    const counts = this.jobData.getCandidateCountsByJob().get(jobId);
    if (!counts) {
      return 0;
    }

    return counts.applied + counts.interview + counts.selected + counts.rejected;
  }
}