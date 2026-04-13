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
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { JobsApiService } from '../../core/services/jobs-api.service';
import { CandidatesApiService } from '../../core/services/candidates-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { Job } from '../../core/models/job.model';
import { MyApplication } from '../../core/models/my-application.model';

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
  /** Active application for this job (not withdrawn), if any. */
  existingApplication = signal<MyApplication | null>(null);

  applicantName = '';
  applicantEmail = '';
  /** Required resume file for this application (PDF or Word). */
  resumeFile: File | null = null;

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

    forkJoin({
      job: this.jobsApi.getJobById(this.jobId),
      apps: this.candidatesApi.listMyApplications().pipe(catchError(() => of<MyApplication[]>([]))),
    }).subscribe({
      next: ({ job, apps }) => {
        this.job.set(job);
        const active = this.pickActiveApplicationForJob(apps, this.jobId);
        this.existingApplication.set(active);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  private pickActiveApplicationForJob(apps: MyApplication[], jobId: number): MyApplication | null {
    const forJob = apps.filter(
      (a) => a.jobId === jobId && (a.rawStatus ?? '').toUpperCase().trim() !== 'WITHDRAWN'
    );
    if (forJob.length === 0) {
      return null;
    }
    forJob.sort((a, b) => {
      const ta = a.appliedAt ?? '';
      const tb = b.appliedAt ?? '';
      return tb.localeCompare(ta);
    });
    return forJob[0] ?? null;
  }

  onResumePicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const f = input.files?.[0];
    this.resumeFile = f ?? null;
  }

  submitApplication(): void {
    const j = this.job();
    if (!j || j.status !== 'Open' || this.existingApplication()) {
      return;
    }
    const name = this.applicantName.trim();
    const email = this.applicantEmail.trim();
    if (!name || !email) {
      this.snackBar.open('Name and email are required.', 'Close', { duration: 4000 });
      return;
    }
    const resume = this.resumeFile;
    if (!resume) {
      this.snackBar.open('Please attach your resume (PDF or Word, up to 5 MB).', 'Close', { duration: 5000 });
      return;
    }
    this.submitting.set(true);
    this.candidatesApi
      .apply({
        job_id: j.id,
        name,
        resume,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.snackBar.open('Application submitted.', 'Close', { duration: 4000 });
          void this.router.navigate(['/portal/applications']);
        },
        error: (err) => {
          this.submitting.set(false);
          const bodyErr = err?.error?.error;
          if (err?.status === 409 && typeof bodyErr === 'string') {
            this.snackBar.open(bodyErr, 'Close', { duration: 5000 });
            void this.candidatesApi
              .listMyApplications()
              .pipe(catchError(() => of<MyApplication[]>([])))
              .subscribe((apps) => {
                this.existingApplication.set(this.pickActiveApplicationForJob(apps, this.jobId));
              });
            return;
          }
          const msg =
            bodyErr ?? (err?.status === 0 ? 'Cannot reach server.' : 'Could not submit application.');
          this.snackBar.open(msg, 'Close', { duration: 5000 });
        },
      });
  }
}
