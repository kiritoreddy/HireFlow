import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InterviewsApiService, FeedbackResult } from '../../core/services/interviews-api.service';
import { Interview, FeedbackSubmit, Recommendation } from '../../core/models/interview.model';

@Component({
  selector: 'app-feedback-form',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './feedback-form.component.html',
  styleUrl: './feedback-form.component.scss',
})
export class FeedbackFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private interviewsApi = inject(InterviewsApiService);
  private snackBar = inject(MatSnackBar);

  interview: Interview | null = null;
  loading = true;
  submitting = false;
  submitted = false;
  error = '';

  // Form fields
  rating = 3;
  technicalScore = 3;
  communication = 3;
  recommendation: Recommendation = 'HIRE';
  comments = '';

  readonly recommendations: { value: Recommendation; label: string }[] = [
    { value: 'STRONG_HIRE', label: 'Strong Hire' },
    { value: 'HIRE', label: 'Hire' },
    { value: 'NO_HIRE', label: 'No Hire' },
    { value: 'STRONG_NO_HIRE', label: 'Strong No Hire' },
  ];

  readonly scoreOptions = [1, 2, 3, 4, 5];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.interviewsApi.getInterview(id).subscribe({
      next: (data) => {
        this.interview = data;
        this.loading = false;

        // If feedback already submitted, populate fields in read-only mode
        if (data?.feedback) {
          this.submitted = true;
          this.rating = data.feedback.rating;
          this.technicalScore = data.feedback.technical_score;
          this.communication = data.feedback.communication;
          this.recommendation = data.feedback.recommendation;
          this.comments = data.feedback.comments ?? '';
        }
      },
      error: () => {
        this.error = 'Failed to load interview details.';
        this.loading = false;
      },
    });
  }

  onSubmit(): void {
    if (this.submitting || this.submitted) return;

    this.submitting = true;
    this.error = '';

    const payload: FeedbackSubmit = {
      rating: this.rating,
      technical_score: this.technicalScore,
      communication: this.communication,
      recommendation: this.recommendation,
      ...(this.comments.trim() ? { comments: this.comments.trim() } : {}),
    };

    this.interviewsApi.submitFeedback(this.interview!.id, payload).subscribe((result: FeedbackResult) => {
      this.submitting = false;

      if (!result.success) {
        this.error = result.error ?? 'Failed to submit feedback.';
        return;
      }

      this.submitted = true;
      this.snackBar.open('Feedback submitted successfully!', 'Close', {
        duration: 4000,
        panelClass: 'snack-success',
      });
      this.router.navigate(['/interviewer/interviews']);
    });
  }

  goBack(): void {
    this.router.navigate(['/interviewer/interviews']);
  }

  scoreLabel(score: number): string {
    return ['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent'][score] ?? '';
  }

  downloadResume(ev: Event): void {
    ev.preventDefault();
    const iv = this.interview;
    if (!iv?.has_resume) return;
    this.interviewsApi.downloadInterviewResume(iv.id).subscribe({
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
}
