import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { InterviewFeedback } from '../../core/models/interview.model';

interface DialogData {
  candidateName: string;
  feedback: InterviewFeedback[];
}

@Component({
  selector: 'app-feedback-view-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './feedback-view-dialog.component.html',
})
export class FeedbackViewDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) readonly data: DialogData) {}
}
