import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { AddCandidateDialogComponent } from './add-candidate-dialog.component';
import { JobDataService } from '../../core/services/job-data.service';
import { JobCandidate, CandidateStage } from '../../core/models/candidate.model';

const STAGES: CandidateStage[] = ['Applied', 'Interview', 'Selected', 'Rejected'];

@Component({
  selector: 'app-job-candidates',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
  ],
  templateUrl: './job-candidates.component.html',
  styleUrl: './job-candidates.component.scss',
})
export class JobCandidatesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private jobData = inject(JobDataService);

  jobId: number | null = null;
  jobTitle = '';
  jobDepartment = '';

  displayedColumns = ['name', 'email', 'stage', 'resume', 'updated'];
  dataSource = new MatTableDataSource<JobCandidate>([]);

  readonly stages = STAGES;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.jobId = +id;
      const job = this.jobData.getJobById(this.jobId);
      this.jobTitle = job?.title ?? `Job #${this.jobId}`;
      this.jobDepartment = job?.department ?? '';
      this.refresh();
    }
  }

  refresh(): void {
    if (this.jobId != null) {
      this.dataSource.data = this.jobData.getCandidatesForJob(this.jobId);
    }
  }

  openAddCandidateDialog(): void {
    const dialogRef = this.dialog.open(AddCandidateDialogComponent, {
      width: '450px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && this.jobId != null) {
        this.jobData.addCandidate({
          jobId: this.jobId,
          name: result.name,
          email: result.email,
          resume: result.resume || '—',
          stage: 'Applied',
        });
        this.refresh();
      }
    });
  }

  onStageChange(candidate: JobCandidate, newStage: CandidateStage): void {
    this.jobData.updateCandidateStage(candidate.id, newStage);
    this.refresh();
  }
}