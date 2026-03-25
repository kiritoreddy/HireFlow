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
import { AddCandidateDialogComponent } from './add-candidate-dialog.component';
import { JobsApiService } from '../../core/services/jobs-api.service';
import { JobApplicationsApiService } from '../../core/services/job-applications-api.service';
import { JobCandidate, CandidateStage } from '../../core/models/candidate.model';

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
  ],
  templateUrl: './job-candidates.component.html',
  styleUrl: './job-candidates.component.scss',
})
export class JobCandidatesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private jobsApi = inject(JobsApiService);
  private applicationsApi = inject(JobApplicationsApiService);
  private snackBar = inject(MatSnackBar);

  jobId: number | null = null;
  jobTitle = '';
  jobDepartment = '';
  searchTerm = '';
  selectedStageFilter: CandidateFilter = 'All';

  displayedColumns = ['name', 'email', 'stage', 'resume', 'updated'];
  dataSource = new MatTableDataSource<JobCandidate>([]);
  allCandidates: JobCandidate[] = [];

  loading = signal(false);
  loadError = signal('');

  readonly stages = STAGES;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.jobId = +id;
      this.loadJobMeta();
      this.refresh();
    }
  }

  loadJobMeta(): void {
    if (this.jobId == null) return;
    this.jobsApi.getById(this.jobId).subscribe({
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
    this.loadError.set('');
    this.applicationsApi.listForJob(this.jobId).subscribe({
      next: (list) => {
        this.allCandidates = list;
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.loadError.set(err?.error?.error ?? err?.message ?? 'Could not load candidates.');
        this.allCandidates = [];
        this.dataSource.data = [];
      },
    });
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
        this.applicationsApi
          .createForJob(this.jobId, {
            name: result.name,
            email: result.email,
            resume: result.resume || '—',
          })
          .subscribe({
            next: () => {
              this.snackBar.open('Candidate added.', 'Close', { duration: 2500 });
              this.refresh();
            },
            error: (err) => {
              const msg = err?.error?.error ?? 'Failed to add candidate';
              this.snackBar.open(msg, 'Close', { duration: 5000 });
            },
          });
      }
    });
  }

  onStageChange(candidate: JobCandidate, newStage: CandidateStage): void {
    this.applicationsApi.updateStage(candidate.id, newStage).subscribe({
      next: () => {
        this.refresh();
      },
      error: (err) => {
        const msg = err?.error?.error ?? 'Failed to update stage';
        this.snackBar.open(msg, 'Close', { duration: 5000 });
        this.refresh();
      },
    });
  }
}
