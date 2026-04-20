import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
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
  ],
  templateUrl: './interviewer-dashboard.component.html',
  styleUrl: './interviewer-dashboard.component.scss',
})
export class InterviewerDashboardComponent implements OnInit {
  private interviewsApi = inject(InterviewsApiService);
  private router = inject(Router);

  interviews: Interview[] = [];
  loading = true;
  error = '';

  get scheduled() { return this.interviews.filter(i => i.status === 'SCHEDULED'); }
  get completed() { return this.interviews.filter(i => i.status === 'COMPLETED'); }
  get cancelled() { return this.interviews.filter(i => i.status === 'CANCELLED'); }

  ngOnInit(): void {
    this.interviewsApi.getMyInterviews().subscribe({
      next: (data) => {
        this.interviews = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load interviews. Please try again.';
        this.loading = false;
      },
    });
  }

  goToFeedback(interview: Interview): void {
    this.router.navigate(['/interviewer/interviews', interview.id, 'feedback']);
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
