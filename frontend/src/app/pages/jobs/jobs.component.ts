import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { JobDataService } from '../../core/services/job-data.service';
import { Job } from '../../core/models/job.model';

@Component({
  selector: 'app-jobs',
  standalone: true,
  imports: [CommonModule, RouterModule, MatTableModule, MatButtonModule],
  templateUrl: './jobs.component.html',
  styleUrl: './jobs.component.scss',
})
export class JobsComponent implements OnInit {
  private jobData = inject(JobDataService);

  displayedColumns: string[] = ['title', 'description', 'department', 'location', 'status', 'actions'];
  dataSource = new MatTableDataSource<Job>([]);

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.dataSource.data = this.jobData.getJobs();
  }
}
