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
import { JobsApiService } from '../../core/services/jobs-api.service';
import { CandidatesApiService } from '../../core/services/candidates-api.service';
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
  private snackBar = inject(MatSnackBar);

  jobId: number | null = null;
  jobTitle = '';
  jobDepartment = '';
  searchTerm = '';
  selectedStageFilter: CandidateFilter = 'All';

  displayedColumns = ['name', 'email', 'stage', 'resume', 'updated', 'actions'];
  dataSource = new MatTableDataSource<JobCandidate>([]);
  allCandidates: JobCandidate[] = [];

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
        this.loading.set(false);
        this.applyFilters();
      },
      error: () => {
        this.allCandidates = [];
        this.loading.set(false);
        this.applyFilters();
        this.snackBar.open('Failed to load candidates.', 'Close', { duration: 4000 });
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
