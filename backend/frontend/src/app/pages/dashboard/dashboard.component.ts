import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
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
            <div class="stat-value">3</div>
            <div class="stat-subtext">Across all departments</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon open">
            <mat-icon>check_circle</mat-icon>
          </div>
          <div class="stat-copy">
            <div class="stat-label">Open Jobs</div>
            <div class="stat-value">2</div>
            <div class="stat-subtext">Currently accepting candidates</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon candidates">
            <mat-icon>groups</mat-icon>
          </div>
          <div class="stat-copy">
            <div class="stat-label">Candidates</div>
            <div class="stat-value">2</div>
            <div class="stat-subtext">Tracked in the pipeline</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon users">
            <mat-icon>group</mat-icon>
          </div>
          <div class="stat-copy">
            <div class="stat-label">Users</div>
            <div class="stat-value">5</div>
            <div class="stat-subtext">Internal system users</div>
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
          <p>Current snapshot of your hiring workflow.</p>

          <div class="summary-list">
            <div class="summary-row">
              <span>Engineering</span>
              <span>1 active role</span>
            </div>
            <div class="summary-row">
              <span>Design</span>
              <span>1 active role</span>
            </div>
            <div class="summary-row">
              <span>Analytics</span>
              <span>1 closed role</span>
            </div>
            <div class="summary-row latest">
              <span>Latest update</span>
              <span>Candidates page styled and wired locally</span>
            </div>
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
        grid-template-columns: repeat(4, minmax(0, 1fr));
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

      .stat-icon.jobs {
        background: #dbe7ff;
        color: #315fcb;
      }

      .stat-icon.open {
        background: #dff3e4;
        color: #3b9c52;
      }

      .stat-icon.candidates {
        background: #ece6ff;
        color: #7c3aed;
      }

      .stat-icon.users {
        background: #f7e7cf;
        color: #dd6b20;
      }

      .stat-copy {
        min-width: 0;
      }

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

      .action-btn mat-icon {
        color: #667085 !important;
        transition: color 0.18s ease;
      }

      .action-btn:hover {
        background: #f8fafc !important;
        border-color: #bfc7d4 !important;
        color: #1d4ed8 !important;
        transform: translateY(-1px);
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
      }

      .action-btn:hover mat-icon {
        color: #1d4ed8 !important;
      }

      .summary-list {
        display: flex;
        flex-direction: column;
        gap: 0;
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

      .summary-row span:first-child {
        font-weight: 700;
      }

      .summary-row span:last-child {
        color: #667085;
      }

      .summary-row.latest span:last-child {
        max-width: 280px;
        text-align: right;
      }

      @media (max-width: 1200px) {
        .stats-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .content-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 768px) {
        .dashboard-page {
          padding: 4px 0 16px;
        }

        .page-title {
          font-size: 28px;
        }

        .stats-grid {
          grid-template-columns: 1fr;
        }

        .panel {
          padding: 20px;
        }
      }
    `,
  ],
})
export class DashboardComponent {}