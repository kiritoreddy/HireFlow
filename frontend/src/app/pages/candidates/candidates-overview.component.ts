import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { JobDataService } from '../../core/services/job-data.service';
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
  imports: [CommonModule, RouterModule],
  templateUrl: './candidates-overview.component.html',
  styleUrls: ['./candidates-overview.component.scss'],
})
export class CandidatesOverviewComponent implements OnInit {
  private jobData = inject(JobDataService);

  jobsWithCounts: JobWithCounts[] = [];

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    const jobs = this.jobData.getJobs();
    const countsMap = this.jobData.getCandidateCountsByJob();
    this.jobsWithCounts = jobs.map((job) => {
      const counts = countsMap.get(job.id) ?? {
        applied: 0,
        interview: 0,
        selected: 0,
        rejected: 0,
      };
      const total =
        counts.applied + counts.interview + counts.selected + counts.rejected;
      return {
        ...job,
        ...counts,
        total,
      };
    });
  }
}
