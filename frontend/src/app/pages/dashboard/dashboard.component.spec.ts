import { TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { JobsApiService } from '../../core/services/jobs-api.service';
import { DashboardApiService } from '../../core/services/dashboard-api.service';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { Job } from '../../core/models/job.model';

const mockJobs: Job[] = [
  { id: 1, title: 'Frontend Engineer', department: 'Engineering', location: 'Remote', description: '', status: 'Open', appliedCount: 2, interviewCount: 1, selectedCount: 0, rejectedCount: 0 },
  { id: 2, title: 'Product Manager', department: 'Product', location: 'NYC', description: '', status: 'Open', appliedCount: 0, interviewCount: 0, selectedCount: 0, rejectedCount: 0 },
  { id: 3, title: 'Designer', department: 'Design', location: 'SF', description: '', status: 'Closed', appliedCount: 1, interviewCount: 0, selectedCount: 1, rejectedCount: 0 },
];

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let jobsApiSpy: { getJobs: ReturnType<typeof vi.fn> };
  let dashboardApiSpy: { getStats: ReturnType<typeof vi.fn> };

  const mockStats = {
    totalJobs: 3,
    openJobs: 2,
    closedJobs: 1,
    totalCandidates: 5,
    totalUsers: 7,
    departmentSummary: [
      { department: 'Engineering', openCount: 1, closedCount: 0 },
      { department: 'Product', openCount: 1, closedCount: 0 },
      { department: 'Design', openCount: 0, closedCount: 1 },
    ],
  };

  beforeEach(async () => {
    jobsApiSpy = { getJobs: vi.fn().mockReturnValue(of(mockJobs)) };
    dashboardApiSpy = { getStats: vi.fn().mockReturnValue(of(mockStats)) };

    TestBed.overrideComponent(DashboardComponent, { set: { template: '' } });

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: DashboardApiService, useValue: dashboardApiSpy },
        { provide: JobsApiService, useValue: jobsApiSpy },
      ],
    }).compileComponents();

    component = TestBed.createComponent(DashboardComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute totalJobs from API response', () => {
    component.ngOnInit();
    expect(component.totalJobs).toBe(3);
  });

  it('should compute openJobs correctly', () => {
    component.ngOnInit();
    expect(component.openJobs).toBe(2);
  });

  it('should compute closedJobs correctly', () => {
    component.ngOnInit();
    expect(component.closedJobs).toBe(1);
  });

  it('should compute totalCandidates as sum of all stage counts', () => {
    component.ngOnInit();
    // job1: 2+1+0+0=3, job2: 0, job3: 1+0+1+0=2 => total=5
    expect(component.totalCandidates).toBe(5);
  });

  it('should build departmentSummary from API jobs', () => {
    component.ngOnInit();
    expect(component.departmentSummary.length).toBe(3);
    const eng = component.departmentSummary.find(d => d.department === 'Engineering');
    expect(eng).toBeDefined();
    expect(eng!.openCount).toBe(1);
    expect(eng!.closedCount).toBe(0);
  });

  it('should set loading to false after success', () => {
    component.ngOnInit();
    expect(component.loading()).toBe(false);
  });

  it('should fall back to jobs API when stats endpoint fails', () => {
    dashboardApiSpy.getStats.mockReturnValue(throwError(() => new Error('Stats endpoint down')));
    component.ngOnInit();
    expect(jobsApiSpy.getJobs).toHaveBeenCalledTimes(1);
    expect(component.totalJobs).toBe(3);
    expect(component.openJobs).toBe(2);
    expect(component.closedJobs).toBe(1);
    expect(component.totalCandidates).toBe(5);
    expect(component.loading()).toBe(false);
  });

  it('should set loading to false even when both APIs fail', () => {
    dashboardApiSpy.getStats.mockReturnValue(throwError(() => new Error('Stats endpoint down')));
    jobsApiSpy.getJobs.mockReturnValue(throwError(() => new Error('Network error')));
    component.ngOnInit();
    expect(component.loading()).toBe(false);
  });
});
