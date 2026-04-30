import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { InterviewFeedback, Recommendation } from '../../core/models/interview.model';

interface DialogData {
  candidateName: string;
  feedback: InterviewFeedback[];
}

@Component({
  selector: 'app-feedback-view-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatChipsModule],
  templateUrl: './feedback-view-dialog.component.html',
  styleUrl: './feedback-view-dialog.component.scss',
})
export class FeedbackViewDialogComponent {
  readonly starIndices: readonly number[] = [1, 2, 3, 4, 5];

  constructor(@Inject(MAT_DIALOG_DATA) readonly data: DialogData) {}

  recommendationLabel(rec: Recommendation): string {
    const labels: Record<Recommendation, string> = {
      STRONG_HIRE: 'Strong hire',
      HIRE: 'Hire',
      NO_HIRE: 'No hire',
      STRONG_NO_HIRE: 'Strong no hire',
    };
    return labels[rec] ?? rec;
  }

  recommendationChipClass(rec: Recommendation): string {
    return 'rec-' + rec.toLowerCase().replace(/_/g, '-');
  }
}
