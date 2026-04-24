import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { User } from '../../core/models/user.model';

interface DialogData {
  interviewers: User[];
  candidateName: string;
}

export interface AssignInterviewerDialogResult {
  interviewerId: string;
  scheduledDate: string;
  interviewType: string;
}

@Component({
  selector: 'app-assign-interviewer-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './assign-interviewer-dialog.component.html',
})
export class AssignInterviewerDialogComponent {
  interviewerId = '';
  scheduledDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  interviewType = 'TECHNICAL';

  constructor(
    @Inject(MAT_DIALOG_DATA) readonly data: DialogData,
    private readonly dialogRef: MatDialogRef<AssignInterviewerDialogComponent>
  ) {}

  submit(): void {
    if (!this.interviewerId || !this.scheduledDate || !this.interviewType) return;
    this.dialogRef.close({
      interviewerId: this.interviewerId,
      scheduledDate: this.scheduledDate,
      interviewType: this.interviewType,
    } satisfies AssignInterviewerDialogResult);
  }
}
