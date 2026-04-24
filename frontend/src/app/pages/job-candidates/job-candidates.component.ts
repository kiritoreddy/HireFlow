import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { AddCandidateDialogComponent } from './add-candidate-dialog.component';
import { AssignInterviewerDialogComponent } from './assign-interviewer-dialog.component';
import { FeedbackViewDialogComponent } from './feedback-view-dialog.component';
import { JobsApiService } from '../../core/services/jobs-api.service';
import { CandidatesApiService } from '../../core/services/candidates-api.service';
import { JobCandidate, CandidateStage } from '../../core/models/candidate.model';
import { InterviewsApiService } from '../../core/services/interviews-api.service';
import { Interview, InterviewFeedback } from '../../core/models/interview.model';
import { User } from '../../core/models/user.model';

const STAGES: CandidateStage[] = ['Applied', 'Interview', 'Selected', 'Rejected'];
type CandidateFilter = 'All' | CandidateStage;

@Component({
  selector: 'app-job-candidates',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTableModule,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatMenuModule,
  ],
  templateUrl: './job-candidates.component.html',
  styleUrl: './job-candidates.component.scss',
})
export class JobCandidatesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private jobsApi = inject(JobsApiService);
  private candidatesApi = inject(CandidatesApiService);
  private interviewsApi = inject(InterviewsApiService);
  private snackBar = inject(MatSnackBar);

  jobId: number | null = null;
  jobTitle = '';
  jobDepartment = '';
  searchTerm = '';
  selectedStageFilter: CandidateFilter = 'All';

  displayedColumns = [
    'name',
    'email',
    'stage',
    'assignedInterviewer',
    'interviewStatus',
    'feedback',
    'resume',
    'updated',
    'actions',
  ];
  dataSource = new MatTableDataSource<JobCandidate>([]);
  allCandidates: JobCandidate[] = [];
  interviewers: User[] = [];
  assignmentsByApplication: Record<string, Interview[]> = {};
  feedbackByApplication: Record<string, InterviewFeedback[]> = {};

  readonly stages = STAGES;
  loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.jobId = +id;
      this.loadJobMeta();
      this.refresh();
    } else {
      this.loading.set(false);
    }
  }

  private loadJobMeta(): void {
    if (this.jobId == null) return;
    this.jobsApi.getJobById(this.jobId).subscribe({
      next: (job) => {
        this.jobTitle = job.title;
        this.jobDepartment = job.department ?? '';
      },
      error: () => {
        this.jobTitle = `Job #${this.jobId}`;
        this.jobDepartment = '';
      },
    });
  }

  refresh(): void {
    if (this.jobId == null) return;
    this.loading.set(true);
    this.candidatesApi.listByJob(this.jobId).subscribe({
      next: (list) => {
        this.allCandidates = list;
        this.applyFilters();
        this.loadInterviewContext();
      },
      error: () => {
        this.allCandidates = [];
        this.applyFilters();
        this.loading.set(false);
        this.snackBar.open('Failed to load candidates.', 'Close', { duration: 4000 });
      },
    });
  }

  private loadInterviewContext(): void {
    const ids = this.allCandidates.map((candidate) => candidate.id);
    if (ids.length === 0) {
      this.assignmentsByApplication = {};
      this.feedbackByApplication = {};
      this.loading.set(false);
      return;
    }

    const assignmentCalls = ids.map((id) =>
      this.interviewsApi.listByApplication(id).subscribe({
        next: (rows) => {
          this.assignmentsByApplication[id] = rows;
          this.checkInterviewContextComplete(ids);
        },
        error: () => {
          this.assignmentsByApplication[id] = [];
          this.checkInterviewContextComplete(ids);
        },
      })
    );

    const feedbackCalls = ids.map((id) =>
      this.interviewsApi.listFeedbackByApplication(id).subscribe({
        next: (rows) => {
          this.feedbackByApplication[id] = rows;
          this.checkInterviewContextComplete(ids);
        },
        error: () => {
          this.feedbackByApplication[id] = [];
          this.checkInterviewContextComplete(ids);
        },
      })
    );

    void assignmentCalls;
    void feedbackCalls;
  }

  private checkInterviewContextComplete(ids: string[]): void {
    const assignmentsReady = ids.every((id) => this.assignmentsByApplication[id] !== undefined);
    const feedbackReady = ids.every((id) => this.feedbackByApplication[id] !== undefined);
    if (assignmentsReady && feedbackReady) this.loading.set(false);
  }

  setStageFilter(filter: CandidateFilter): void {
    this.selectedStageFilter = filter;
    this.applyFilters();
  }

  applySearch(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase();

    this.dataSource.data = this.allCandidates.filter((candidate) => {
      const matchesSearch =
        !search ||
        candidate.name.toLowerCase().includes(search) ||
        candidate.email.toLowerCase().includes(search);

      const matchesStage =
        this.selectedStageFilter === 'All' || candidate.stage === this.selectedStageFilter;

      return matchesSearch && matchesStage;
    });
  }

  openAddCandidateDialog(): void {
    const dialogRef = this.dialog.open(AddCandidateDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && this.jobId != null) {
        this.candidatesApi
          .apply({
            job_id: this.jobId,
            name: result.name,
            email: result.email,
            resume_path: result.resume || '',
          })
          .subscribe({
            next: () => {
              this.snackBar.open('Candidate added.', 'Close', { duration: 2500 });
              this.refresh();
            },
            error: () => this.snackBar.open('Failed to add candidate.', 'Close', { duration: 4000 }),
          });
      }
    });
  }

  openAssignInterviewerDialog(candidate: JobCandidate): void {
    this.interviewsApi.listInterviewers().subscribe({
      next: (interviewers) => {
        this.interviewers = interviewers.filter((user) => user.isActive);
        const dialogRef = this.dialog.open(AssignInterviewerDialogComponent, {
          width: '560px',
          maxWidth: '95vw',
          data: { interviewers: this.interviewers, candidateName: candidate.name },
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (!result) return;
          this.interviewsApi
            .assignInterviewer({
              application_id: candidate.id,
              interviewer_id: result.interviewerId,
              scheduled_date: result.scheduledDate,
              interview_type: result.interviewType.toUpperCase(),
            })
            .subscribe({
              next: () => {
                this.snackBar.open('Interviewer assigned.', 'Close', { duration: 2500 });
                this.refresh();
              },
              error: () => this.snackBar.open('Failed to assign interviewer.', 'Close', { duration: 4000 }),
            });
        });
      },
      error: () => this.snackBar.open('Failed to load interviewers.', 'Close', { duration: 4000 }),
    });
  }

  getAssignedInterviewers(candidate: JobCandidate): string {
    const rows = this.assignmentsByApplication[candidate.id] ?? [];
    if (rows.length === 0) return 'Unassigned';
    return rows.map((row) => row.interviewer?.name || `Interviewer #${row.interviewer_id}`).join(', ');
  }

  getInterviewStatus(candidate: JobCandidate): string {
    const assignments = this.assignmentsByApplication[candidate.id] ?? [];
    const feedback = this.feedbackByApplication[candidate.id] ?? [];
    if (assignments.length === 0) return 'Pending';
    if (feedback.length > 0) return 'Completed';
    if (assignments.some((row) => row.status === 'SCHEDULED')) return 'Scheduled';
    return 'Pending';
  }

  hasFeedback(candidate: JobCandidate): boolean {
    return (this.feedbackByApplication[candidate.id] ?? []).length > 0;
  }

  openFeedback(candidate: JobCandidate): void {
    const feedback = this.feedbackByApplication[candidate.id] ?? [];
    this.dialog.open(FeedbackViewDialogComponent, {
      width: '640px',
      maxWidth: '95vw',
      data: { candidateName: candidate.name, feedback },
    });
  }

  onStageChange(candidate: JobCandidate, newStage: CandidateStage): void {
    this.candidatesApi.updateStage(candidate.id, newStage).subscribe({
      next: () => {
        this.snackBar.open(`Stage updated to ${newStage}.`, 'Close', { duration: 2000 });
        this.refresh();
      },
      error: () => this.snackBar.open('Failed to update stage.', 'Close', { duration: 4000 }),
    });
  }

  deleteCandidate(candidate: JobCandidate): void {
    const confirmed = confirm(
      `Remove "${candidate.name}" from this job?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    this.candidatesApi.deleteApplication(candidate.id).subscribe({
      next: () => {
        this.snackBar.open('Candidate removed.', 'Close', { duration: 2500 });
        this.refresh();
      },
      error: () => this.snackBar.open('Failed to remove candidate.', 'Close', { duration: 4000 }),
    });
  }
}
