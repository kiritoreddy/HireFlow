import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CandidatesApiService } from '../../core/services/candidates-api.service';
import { MyApplication } from '../../core/models/my-application.model';

@Component({
  selector: 'app-candidate-my-applications',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './candidate-my-applications.component.html',
  styleUrl: './candidate-my-applications.component.scss',
})
export class CandidateMyApplicationsComponent implements OnInit {
  private candidatesApi = inject(CandidatesApiService);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  loadError = signal(false);
  rows = signal<MyApplication[]>([]);
  withdrawingId = signal<string | null>(null);

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.candidatesApi.listMyApplications().subscribe({
      next: (list) => {
        this.rows.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.rows.set([]);
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  canWithdraw(row: MyApplication): boolean {
    const raw = (row.rawStatus ?? '').toUpperCase();
    return raw !== 'WITHDRAWN' && raw !== 'SELECTED' && raw !== 'REJECTED';
  }

  withdraw(row: MyApplication): void {
    if (!this.canWithdraw(row)) {
      return;
    }
    this.withdrawingId.set(row.id);
    this.candidatesApi.withdraw(row.id).subscribe({
      next: () => {
        this.withdrawingId.set(null);
        this.snackBar.open('Application withdrawn.', 'Close', { duration: 4000 });
        this.refresh();
      },
      error: (err) => {
        this.withdrawingId.set(null);
        const msg = err?.error?.error ?? 'Could not withdraw.';
        this.snackBar.open(msg, 'Close', { duration: 5000 });
      },
    });
  }
}
