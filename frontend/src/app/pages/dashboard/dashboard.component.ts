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
      <div class="page-header">
        <div>
          <p class="eyebrow">Overview</p>
          <h1>Dashboard</h1>
          <p class="subtitle">
            Welcome to HireFlow. Track hiring activity and jump into key workflows.
          </p>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue">
            <mat-icon>work</mat-icon>
          </div>
          <div class="stat-content">
            <p class="stat-label">Total Jobs</p>
            <h3>3</h3>
            <span class="stat-note">Across all departments</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon green">
            <mat-icon>check_circle</mat-icon>
          </div>
          <div class="stat-content">
            <p class="stat-label">Open Jobs</p>
            <h3>2</h3>
            <span class="stat-note">Currently accepting candidates</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon purple">
            <mat-icon>groups</mat-icon>
          </div>
          <div class="stat-content">
            <p class="stat-label">Candidates</p>
            <h3>2</h3>
            <span class="stat-note">Tracked in the pipeline</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon orange">
            <mat-icon>group</mat-icon>
          </div>
          <div class="stat-content">
            <p class="stat-label">Users</p>
            <h3>5</h3>
            <span class="stat-note">Internal system users</span>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <section class="panel">
          <div class="panel-header">
            <div>
              <h2>Quick Actions</h2>
              <p>Open the most important sections quickly.</p>
            </div>
          </div>

          <div class="action-grid">
            <a mat-flat-button color="primary" routerLink="/jobs" class="action-btn">
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
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <h2>Hiring Summary</h2>
              <p>Current snapshot of your hiring workflow.</p>
            </div>
          </div>

          <div class="summary-list">
            <div class="summary-row">
              <span class="summary-label">Engineering</span>
              <span class="summary-value">1 active role</span>
            </div>

            <div class="summary-row">
              <span class="summary-label">Design</span>
              <span class="summary-value">1 active role</span>
            </div>

            <div class="summary-row">
              <span class="summary-label">Analytics</span>
              <span class="summary-value">1 closed role</span>
            </div>

            <div class="summary-row">
              <span class="summary-label">Latest update</span>
              <span class="summary-value">Candidates page styled and wired locally</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        font-family: 'Inter', sans-serif;
      }

      .dashboard-page {
        max-width: 1240px;
      }

      .page-header {
        margin-bottom: 24px;
      }

      .eyebrow {
        margin: 0 0 8px;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #2563eb;
      }

      h1 {
        margin: 0 0 8px;
        font-size: 28px;
        line-height: 1.1;
        font-weight: 800;
        color: #0f172a;
      }

      .subtitle {
        margin: 0;
        color: #667085;
        font-size: 15px;
        line-height: 1.5;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 18px;
        margin-bottom: 24px;
      }

      .stat-card {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        padding: 20px;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 20px;
        box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
      }

      .stat-icon {
        width: 44px;
        height: 44px;
        border-radius: 14px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .stat-icon mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
      }

      .stat-icon.blue {
        background: #dbeafe;
        color: #2563eb;
      }

      .stat-icon.green {
        background: #dcfce7;
        color: #16a34a;
      }

      .stat-icon.purple {
        background: #ede9fe;
        color: #7c3aed;
      }

      .stat-icon.orange {
        background: #ffedd5;
        color: #ea580c;
      }

      .stat-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .stat-label {
        margin: 0;
        font-size: 14px;
        color: #667085;
        font-weight: 600;
      }

      .stat-content h3 {
        margin: 0;
        font-size: 28px;
        line-height: 1;
        font-weight: 800;
        color: #0f172a;
      }

      .stat-note {
        font-size: 13px;
        color: #94a3b8;
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: 1.2fr 1fr;
        gap: 20px;
      }

      .panel {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 20px;
        padding: 22px;
        box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
      }

      .panel-header {
        margin-bottom: 18px;
      }

      .panel-header h2 {
        margin: 0 0 6px;
        font-size: 18px;
        font-weight: 700;
        color: #0f172a;
      }

      .panel-header p {
        margin: 0;
        font-size: 14px;
        color: #667085;
      }

      .action-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      .action-btn {
        min-height: 44px;
        border-radius: 12px;
        font-weight: 600;
      }

      .action-btn mat-icon {
        margin-right: 6px;
      }

      .summary-list {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid #f1f5f9;
      }

      .summary-row:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      .summary-label {
        font-size: 14px;
        font-weight: 600;
        color: #334155;
      }

      .summary-value {
        font-size: 14px;
        color: #667085;
        text-align: right;
      }

      @media (max-width: 1100px) {
        .stats-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .dashboard-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 640px) {
        .stats-grid {
          grid-template-columns: 1fr;
        }

        h1 {
          font-size: 24px;
        }

        .panel,
        .stat-card {
          padding: 18px;
        }
      }
    `,
  ],
})
export class DashboardComponent {}