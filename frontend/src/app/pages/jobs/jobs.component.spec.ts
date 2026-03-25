import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { JobsComponent } from './jobs.component';
import { JobsApiService } from '../../core/services/jobs-api.service';
import { Job } from '../../core/models/job.model';

const mockJobs: Job[] = [
  {
    id: 1,
    title: 'Senior Software Engineer',
    description: 'Build web apps.',
    department: 'Engineering',
    location: 'Remote',
    status: 'Open',
    candidateCount: 1,
    appliedCount: 1,
    interviewCount: 0,
    selectedCount: 0,
    rejectedCount: 0,
  },
  {
    id: 2,
    title: 'Product Designer',
    description: 'Design UX.',
    department: 'Design',
    location: 'San Francisco',
    status: 'Open',
    candidateCount: 0,
    appliedCount: 0,
    interviewCount: 0,
    selectedCount: 0,
    rejectedCount: 0,
  },
  {
    id: 3,
    title: 'Data Analyst',
    description: 'Analyze data.',
    department: 'Analytics',
    location: 'New York',
    status: 'Closed',
    candidateCount: 0,
    appliedCount: 0,
    interviewCount: 0,
    selectedCount: 0,
    rejectedCount: 0,
  },
];

describe('JobsComponent', () => {
  let component: JobsComponent;

  beforeEach(async () => {
    TestBed.overrideComponent(JobsComponent, {
      set: {
        template: '',
      },
    });

    await TestBed.configureTestingModule({
      imports: [JobsComponent],
      providers: [
        {
          provide: JobsApiService,
          useValue: {
            getJobs: () => of(mockJobs),
            createJob: () => of({}),
            updateJob: () => of({}),
            deleteJob: () => of(void 0),
          },
        },
        {
          provide: MatSnackBar,
          useValue: { open: () => ({}) },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(JobsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the jobs component', () => {
    expect(component).toBeTruthy();
  });

  it('should load all jobs on init', () => {
    expect(component.dataSource.data.length).toBe(mockJobs.length);
  });

  it('should filter jobs by search term', () => {
    component.searchQuery = 'Designer';
    component.onSearchChange();

    expect(component.dataSource.data.length).toBe(1);
    expect(component.dataSource.data[0].title).toContain('Product Designer');
  });

  it('should filter only open jobs', () => {
    component.statusFilter = 'Open';
    component.onStatusFilterChange();

    expect(component.dataSource.data.length).toBe(2);
    expect(component.dataSource.data.every((job) => job.status === 'Open')).toBe(true);
  });

  it('should filter only closed jobs', () => {
    component.statusFilter = 'Closed';
    component.onStatusFilterChange();

    expect(component.dataSource.data.length).toBe(1);
    expect(component.dataSource.data[0].status).toBe('Closed');
  });

  it('should combine search and filter correctly', () => {
    component.statusFilter = 'Open';
    component.onStatusFilterChange();
    component.searchQuery = 'Engineer';
    component.onSearchChange();

    expect(component.dataSource.data.length).toBe(1);
    expect(component.dataSource.data[0].title).toBe('Senior Software Engineer');
    expect(component.dataSource.data[0].status).toBe('Open');
  });

  it('should return correct candidate count for a job', () => {
    const job = mockJobs[0];
    const count = component.getCandidateCount(job);
    expect(count).toBe(1);
  });
});
