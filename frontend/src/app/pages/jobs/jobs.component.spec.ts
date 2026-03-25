import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { JobsComponent } from './jobs.component';
import { JobDataService } from '../../core/services/job-data.service';

describe('JobsComponent', () => {
  let component: JobsComponent;
  let jobDataService: JobDataService;

  beforeEach(async () => {
    TestBed.overrideComponent(JobsComponent, {
      set: {
        template: '',
      },
    });

    await TestBed.configureTestingModule({
      imports: [JobsComponent],
      providers: [
        JobDataService,
        {
          provide: MatSnackBar,
          useValue: { open: () => ({}) },
        },
      ],
    }).compileComponents();

    component = TestBed.createComponent(JobsComponent).componentInstance;
    jobDataService = TestBed.inject(JobDataService);

    component.ngOnInit();
  });

  it('should create the jobs component', () => {
    expect(component).toBeTruthy();
  });

  it('should load all jobs on init', () => {
    const jobs = jobDataService.getJobs();
    expect(component.dataSource.data.length).toBe(jobs.length);
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
    const count = component.getCandidateCount(1);
    expect(count).toBe(1);
  });
});
