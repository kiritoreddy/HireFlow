import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DashboardApiService, DashboardStats, DepartmentStat } from '../../core/services/dashboard-api.service';
import { JobsApiService } from '../../core/services/jobs-api.service';
import { Job } from '../../core/models/job.model';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="dashboard-page">
      <p class="eyebrow">OVERVIEW</p>
      <h1 class="page-title">Dashboard</h1>
      <p class="subtitle">
        Welcome to HireFlow. Track hiring activity and jump into key workflows.
      </p>

      <section class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon jobs">
            <mat-icon>work</mat-icon>
          </div>
          <div class="stat-copy">
            <div class="stat-label">Total Jobs</div>
            <div class="stat-value">{{ totalJobs }}</div>
            <div class="stat-subtext">Across all departments</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon open">
            <mat-icon>check_circle</mat-icon>
          </div>
          <div class="stat-copy">
            <div class="stat-label">Open Jobs</div>
            <div class="stat-value">{{ openJobs }}</div>
            <div class="stat-subtext">Currently accepting candidates</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon candidates">
            <mat-icon>groups</mat-icon>
          </div>
          <div class="stat-copy">
            <div class="stat-label">Candidates</div>
            <div class="stat-value">{{ totalCandidates }}</div>
            <div class="stat-subtext">Tracked in the pipeline</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon closed">
            <mat-icon>cancel</mat-icon>
          </div>
          <div class="stat-copy">
            <div class="stat-label">Closed Jobs</div>
            <div class="stat-value">{{ closedJobs }}</div>
            <div class="stat-subtext">No longer accepting applicants</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon users">
            <mat-icon>manage_accounts</mat-icon>
          </div>
          <div class="stat-copy">
            <div class="stat-label">Total Users</div>
            <div class="stat-value">{{ totalUsers }}</div>
            <div class="stat-subtext">Registered in the system</div>
          </div>
        </div>
      </section>

      <section class="content-grid">
        <div class="panel quick-actions">
          <h2>Quick Actions</h2>
          <p>Open the most important sections quickly.</p>

          <div class="action-row">
            <a mat-stroked-button routerLink="/jobs" class="action-btn">
              <mat-icon>work</mat-icon>
              View Jobs
            </a>

            <a mat-stroked-button routerLink="/candidates" class="action-btn">
              <mat-icon>groups</mat-icon>
              View Candidates
            </a>

            <a mat-stroked-button routerLink="/users" class="action-btn">
              <mat-icon>group</mat-icon>
              Manage Users
            </a>
          </div>
        </div>

        <div class="panel hiring-summary">
          <h2>Hiring Summary</h2>
          <p>Current snapshot by department.</p>

          <div class="summary-list">
            @if (loading()) {
              <div class="summary-row">
                <span>Loading…</span>
              </div>
            } @else {
              @for (dept of departmentSummary; track dept.department) {
                <div class="summary-row">
                  <span>{{ dept.department }}</span>
                  <span>
                    {{ dept.openCount }} open
                    @if (dept.closedCount > 0) {
                      · {{ dept.closedCount }} closed
                    }
                  </span>
                </div>
              }
              @if (departmentSummary.length === 0) {
                <div class="summary-row">
                  <span>No jobs yet</span>
                  <span>—</span>
                </div>
              }
            }
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        font-family: 'Inter', sans-serif;
      }

      .dashboard-page {
        padding: 12px 8px 24px;
      }

      .eyebrow {
        margin: 0 0 8px;
        color: #315fcb;
        font-size: 14px;
        font-weight: 800;
        letter-spacing: 0.08em;
      }

      .page-title {
        margin: 0;
        font-size: 32px;
        line-height: 1.1;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: -0.03em;
      }

      .subtitle {
        margin: 10px 0 28px;
        color: #667085;
        font-size: 16px;
        line-height: 1.6;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 20px;
        margin-bottom: 24px;
      }

      .stat-card {
        display: flex;
        gap: 16px;
        align-items: flex-start;
        background: #ffffff;
        border: 1px solid #e4e7ec;
        border-radius: 24px;
        padding: 22px;
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
      }

      .stat-icon {
        width: 56px;
        height: 56px;
        border-radius: 18px;
        display: grid;
        place-items: center;
        flex-shrink: 0;
      }

      .stat-icon mat-icon {
        font-size: 26px;
        width: 26px;
        height: 26px;
      }

      .stat-icon.jobs       { background: #dbe7ff; color: #315fcb; }
      .stat-icon.open       { background: #dff3e4; color: #3b9c52; }
      .stat-icon.candidates { background: #ece6ff; color: #7c3aed; }
      .stat-icon.closed     { background: #fdecea; color: #d32f2f; }
      .stat-icon.users      { background: #fff4e5; color: #d97706; }

      .stat-copy { min-width: 0; }

      .stat-label {
        color: #667085;
        font-size: 14px;
        font-weight: 700;
        margin-bottom: 4px;
      }

      .stat-value {
        color: #0f172a;
        font-size: 22px;
        font-weight: 800;
        line-height: 1;
        margin-bottom: 8px;
      }

      .stat-subtext {
        color: #98a2b3;
        font-size: 14px;
        line-height: 1.4;
      }

      .content-grid {
        display: grid;
        grid-template-columns: 1.25fr 1fr;
        gap: 20px;
      }

      .panel {
        background: #ffffff;
        border: 1px solid #e4e7ec;
        border-radius: 24px;
        padding: 28px;
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
      }

      .panel h2 {
        margin: 0 0 6px;
        font-size: 20px;
        font-weight: 800;
        color: #0f172a;
      }

      .panel p {
        margin: 0 0 22px;
        color: #667085;
        font-size: 15px;
      }

      .action-row {
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
      }

      .action-btn {
        height: 48px;
        padding: 0 18px;
        border-radius: 14px;
        border-color: #d0d5dd !important;
        background: #ffffff !important;
        color: #344054 !important;
        font-weight: 700;
        transition: all 0.18s ease;
      }

      .action-btn mat-icon { color: #667085 !important; }

      .action-btn:hover {
        background: #f8fafc !important;
        border-color: #bfc7d4 !important;
        color: #1d4ed8 !important;
        transform: translateY(-1px);
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
      }

      .action-btn:hover mat-icon { color: #1d4ed8 !important; }

      .summary-list {
        display: flex;
        flex-direction: column;
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 0;
        border-top: 1px solid #eaecf0;
        color: #344054;
        font-size: 15px;
      }

      .summary-row:first-child {
        border-top: none;
        padding-top: 0;
      }

      .summary-row span:first-child { font-weight: 700; }
      .summary-row span:last-child  { color: #667085; }

      @media (max-width: 1400px) {
        .stats-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      }

      @media (max-width: 1000px) {
        .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .content-grid { grid-template-columns: 1fr; }
      }

      @media (max-width: 768px) {
        .dashboard-page { padding: 4px 0 16px; }
        .page-title { font-size: 28px; }
        .stats-grid { grid-template-columns: 1fr; }
        .panel { padding: 20px; }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  private dashboardApi = inject(DashboardApiService);
  private jobsApi = inject(JobsApiService);

  totalJobs = 0;
  openJobs = 0;
  closedJobs = 0;
  totalCandidates = 0;
  totalUsers = 0;
  departmentSummary: DepartmentStat[] = [];
  loading = signal(true);

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);

    // Try the dedicated stats endpoint first; fall back to deriving from /jobs
    this.dashboardApi.getStats().pipe(
      catchError(() => of(null))
    ).subscribe((stats) => {
      if (stats) {
        this.totalJobs = stats.totalJobs;
        this.openJobs = stats.openJobs;
        this.closedJobs = stats.closedJobs;
        this.totalCandidates = stats.totalCandidates;
        this.totalUsers = stats.totalUsers;
        this.departmentSummary = stats.departmentSummary;
        this.loading.set(false);
      } else {
        // Fallback: derive from GET /jobs until backend endpoint is ready
        this.jobsApi.getJobs().subscribe({
          next: (jobs: Job[]) => {
            this.totalJobs = jobs.length;
            this.openJobs = jobs.filter((j) => j.status === 'Open').length;
            this.closedJobs = jobs.filter((j) => j.status === 'Closed').length;
            this.totalCandidates = jobs.reduce((sum, j) => {
              return sum + (j.candidateCount ??
                (j.appliedCount ?? 0) + (j.interviewCount ?? 0) +
                (j.selectedCount ?? 0) + (j.rejectedCount ?? 0));
            }, 0);
            this.totalUsers = 0; // not available from jobs endpoint
            const deptMap = new Map<string, DepartmentStat>();
            for (const job of jobs) {
              const dept = job.department || 'General';
              if (!deptMap.has(dept)) deptMap.set(dept, { department: dept, openCount: 0, closedCount: 0 });
              const entry = deptMap.get(dept)!;
              if (job.status === 'Open') entry.openCount++;
              else entry.closedCount++;
            }
            this.departmentSummary = Array.from(deptMap.values());
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      }
    });
  }
}
