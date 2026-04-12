import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Job } from '../../core/models/job.model';

export interface JobFormDialogData {
  job?: Job;
}

export interface JobFormResult {
  title: string;
  department: string;
  location: string;
  description: string;
  status: Job['status'];
}

@Component({
  selector: 'app-job-form-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit Job' : 'Create Job' }}</h2>

    <mat-dialog-content>
      <div class="form-fields">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Job Title *</mat-label>
          <input
            matInput
            [(ngModel)]="title"
            placeholder="e.g. Senior Software Engineer"
          />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Department</mat-label>
          <input
            matInput
            [(ngModel)]="department"
            placeholder="e.g. Engineering"
          />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Location</mat-label>
          <input matInput [(ngModel)]="location" placeholder="e.g. Remote" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea
            matInput
            [(ngModel)]="description"
            rows="3"
            placeholder="Describe the role and requirements..."
          ></textarea>
        </mat-form-field>

        @if (isEdit) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="status">
              <mat-option value="Open">Open</mat-option>
              <mat-option value="Closed">Closed</mat-option>
            </mat-select>
          </mat-form-field>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancel</button>
      <button
        mat-flat-button
        color="primary"
        (click)="save()"
        [disabled]="!title.trim()"
      >
        {{ isEdit ? 'Save Changes' : 'Create Job' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .form-fields {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 8px 0;
        min-width: 420px;
      }

      .full-width {
        width: 100%;
      }
    `,
  ],
})
export class JobFormDialogComponent {
  readonly isEdit: boolean;

  title = '';
  department = '';
  location = '';
  description = '';
  status: Job['status'] = 'Open';

  constructor(
    private dialogRef: MatDialogRef<JobFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: JobFormDialogData
  ) {
    this.isEdit = !!data?.job;
    if (data?.job) {
      this.title = data.job.title;
      this.department = data.job.department ?? '';
      this.location = data.job.location ?? '';
      this.description = data.job.description ?? '';
      this.status = data.job.status;
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (!this.title.trim()) return;

    const result: JobFormResult = {
      title: this.title.trim(),
      department: this.department.trim() || 'General',
      location: this.location.trim() || 'Remote',
      description: this.description.trim() || 'No description provided.',
      status: this.status,
    };
    this.dialogRef.close(result);
  }
}
