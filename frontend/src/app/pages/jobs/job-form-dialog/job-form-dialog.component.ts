import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Job } from '../../../core/models/job.model';

export interface JobFormValue {
  title: string;
  department: string;
  location: string;
  description: string;
  status: Job['status'];
}

export interface JobFormDialogData {
  job?: Job;
}

@Component({
  selector: 'app-job-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './job-form-dialog.component.html',
  styleUrl: './job-form-dialog.component.scss',
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

  get dialogTitle(): string {
    return this.isEdit ? 'Edit job' : 'Create job';
  }

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (!this.title.trim()) return;
    const value: JobFormValue = {
      title: this.title.trim(),
      department: this.department.trim(),
      location: this.location.trim(),
      description: this.description.trim(),
      status: this.status,
    };
    this.dialogRef.close(value);
  }
}

