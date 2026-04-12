import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { JobsApiService } from '../../core/services/jobs-api.service';
import { CandidatesApiService } from '../../core/services/candidates-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { Job } from '../../core/models/job.model';

@Component({
  selector: 'app-candidate-job-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './candidate-job-detail.component.html',
  styleUrl: './candidate-job-detail.component.scss',
})
export class CandidateJobDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private jobsApi = inject(JobsApiService);
  private candidatesApi = inject(CandidatesApiService);
  private auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  jobId = 0;
  job = signal<Job | null>(null);
  loading = signal(true);
  notFound = signal(false);
  submitting = signal(false);

  applicantName = '';
  applicantEmail = '';
  resumeNote = '';

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.jobId = idParam ? parseInt(idParam, 10) : 0;
    const user = this.auth.getCurrentUser();
    this.applicantName = user?.displayName ?? '';
    this.applicantEmail = user?.email ?? '';
    if (!this.jobId || Number.isNaN(this.jobId)) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }
    this.jobsApi.getJobById(this.jobId).subscribe({
      next: (j) => {
        this.job.set(j);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  submitApplication(): void {
    const j = this.job();
    if (!j || j.status !== 'Open') {
      return;
    }
    const name = this.applicantName.trim();
    const email = this.applicantEmail.trim();
    if (!name || !email) {
      this.snackBar.open('Name and email are required.', 'Close', { duration: 4000 });
      return;
    }
    this.submitting.set(true);
    this.candidatesApi
      .apply({
        job_id: j.id,
        name,
        email,
        resume_path: this.resumeNote.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.snackBar.open('Application submitted.', 'Close', { duration: 4000 });
          void this.router.navigate(['/portal/applications']);
        },
        error: (err) => {
          this.submitting.set(false);
          const msg =
            err?.error?.error ??
            (err?.status === 0 ? 'Cannot reach server.' : 'Could not submit application.');
          this.snackBar.open(msg, 'Close', { duration: 5000 });
        },
      });
  }
}
