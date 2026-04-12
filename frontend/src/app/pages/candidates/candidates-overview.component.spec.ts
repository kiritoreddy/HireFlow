import { TestBed } from '@angular/core/testing';
import { CandidatesOverviewComponent } from './candidates-overview.component';
import { JobsApiService } from '../../core/services/jobs-api.service';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Job } from '../../core/models/job.model';

const mockJobs: Job[] = [
  { id: 1, title: 'Frontend Engineer', department: 'Engineering', location: 'Remote', description: '', status: 'Open', appliedCount: 1, interviewCount: 0, selectedCount: 0, rejectedCount: 0 },
  { id: 2, title: 'Product Manager', department: 'Product', location: 'NYC', description: '', status: 'Open', appliedCount: 0, interviewCount: 0, selectedCount: 0, rejectedCount: 0 },
  { id: 3, title: 'Designer', department: 'Design', location: 'SF', description: '', status: 'Closed', appliedCount: 0, interviewCount: 0, selectedCount: 1, rejectedCount: 0 },
];

describe('CandidatesOverviewComponent', () => {
  let component: CandidatesOverviewComponent;
  let jobsApiSpy: { getJobs: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    jobsApiSpy = { getJobs: vi.fn().mockReturnValue(of(mockJobs)) };

    TestBed.overrideComponent(CandidatesOverviewComponent, { set: { template: '' } });

    await TestBed.configureTestingModule({
      imports: [CandidatesOverviewComponent],
      providers: [
        provideRouter([]),
        { provide: JobsApiService, useValue: jobsApiSpy },
      ],
    }).compileComponents();

    component = TestBed.createComponent(CandidatesOverviewComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load jobs with candidate counts on init', () => {
    component.ngOnInit();
    expect(component.jobsWithCounts.length).toBe(3);
  });

  it('should compute total candidate count per job', () => {
    component.ngOnInit();
    const job1Entry = component.jobsWithCounts.find(j => j.id === 1);
    expect(job1Entry).toBeDefined();
    expect(job1Entry!.total).toBe(1);
    expect(job1Entry!.applied).toBe(1);
  });

  it('should show zero counts for jobs with no candidates', () => {
    component.ngOnInit();
    const job2Entry = component.jobsWithCounts.find(j => j.id === 2);
    expect(job2Entry).toBeDefined();
    expect(job2Entry!.total).toBe(0);
  });

  it('should include job status in each entry', () => {
    component.ngOnInit();
    const job3Entry = component.jobsWithCounts.find(j => j.id === 3);
    expect(job3Entry!.status).toBe('Closed');
  });

  it('should set loading to false after successful fetch', () => {
    component.ngOnInit();
    expect(component.loading()).toBe(false);
  });

  it('should set loading to false and empty array on error', () => {
    jobsApiSpy.getJobs.mockReturnValue(throwError(() => new Error('API error')));
    component.ngOnInit();
    expect(component.loading()).toBe(false);
    expect(component.jobsWithCounts.length).toBe(0);
  });
});
