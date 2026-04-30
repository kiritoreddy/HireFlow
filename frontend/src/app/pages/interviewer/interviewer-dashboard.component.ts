import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';
import { finalize } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InterviewsApiService } from '../../core/services/interviews-api.service';
import { Interview, InterviewStatus } from '../../core/models/interview.model';

@Component({
  selector: 'app-interviewer-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    NgClass,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './interviewer-dashboard.component.html',
  styleUrl: './interviewer-dashboard.component.scss',
})
export class InterviewerDashboardComponent implements OnInit {
  private interviewsApi = inject(InterviewsApiService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  interviews: Interview[] = [];
  loading = true;
  error = '';

  get scheduled() { return this.interviews.filter(i => i.status === 'SCHEDULED'); }
  get completed() { return this.interviews.filter(i => i.status === 'COMPLETED'); }
  get cancelled() { return this.interviews.filter(i => i.status === 'CANCELLED'); }

  ngOnInit(): void {
    this.loading = true;
    this.error = '';
    this.interviewsApi
      .getMyInterviews()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => {
          this.interviews = data;
        },
        error: (err: unknown) => {
          this.error =
            err instanceof Error && err.message
              ? err.message
              : 'Failed to load interviews. Please try again.';
        },
      });
  }

  goToFeedback(interview: Interview): void {
    this.router.navigate(['/interviewer/interviews', interview.id, 'feedback']);
  }

  downloadResume(interview: Interview, ev: Event): void {
    ev.stopPropagation();
    if (!interview.has_resume) return;
    this.interviewsApi.downloadInterviewResume(interview.id).subscribe({
      next: ({ blob, filename }) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.rel = 'noopener';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.snackBar.open('Could not download resume.', 'Close', { duration: 5000 });
      },
    });
  }

  statusClass(status: InterviewStatus): string {
    return {
      SCHEDULED: 'status-scheduled',
      COMPLETED: 'status-completed',
      CANCELLED: 'status-cancelled',
    }[status] ?? '';
  }

  statusLabel(status: InterviewStatus): string {
    return { SCHEDULED: 'Scheduled', COMPLETED: 'Completed', CANCELLED: 'Cancelled' }[status] ?? status;
  }
}
