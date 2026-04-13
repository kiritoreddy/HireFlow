import { TestBed } from '@angular/core/testing';
import { JobCandidatesComponent } from './job-candidates.component';
import { JobsApiService } from '../../core/services/jobs-api.service';
import { CandidatesApiService } from '../../core/services/candidates-api.service';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JobCandidate } from '../../core/models/candidate.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

const mockCandidates: JobCandidate[] = [
  { id: 'c1', jobId: 1, name: 'Harper Moore', email: 'harper@email.com', resume: 'harper.pdf', stage: 'Applied' },
  { id: 'c2', jobId: 1, name: 'Alex Rivera', email: 'alex@email.com', resume: 'alex.pdf', stage: 'Interview' },
];

const makeActivatedRoute = (jobId: string) => ({
  snapshot: { paramMap: { get: (_: string) => jobId } },
});

describe('JobCandidatesComponent', () => {
  let component: JobCandidatesComponent;
  let jobsApiSpy: { getJobById: ReturnType<typeof vi.fn>; getJobs: ReturnType<typeof vi.fn> };
  let candidatesApiSpy: {
    listByJob: ReturnType<typeof vi.fn>;
    updateStage: ReturnType<typeof vi.fn>;
    deleteApplication: ReturnType<typeof vi.fn>;
    apply: ReturnType<typeof vi.fn>;
  };
  let snackBarSpy: { open: ReturnType<typeof vi.fn> };

  const setupForJob = async (jobId: string) => {
    jobsApiSpy = {
      getJobById: vi.fn().mockReturnValue(of({ id: 1, title: 'Senior Software Engineer', department: 'Engineering', location: 'Remote', description: '', status: 'Open' })),
      getJobs: vi.fn().mockReturnValue(of([])),
    };
    candidatesApiSpy = {
      listByJob: vi.fn().mockReturnValue(of(mockCandidates)),
      updateStage: vi.fn().mockReturnValue(of(undefined)),
      deleteApplication: vi.fn().mockReturnValue(of(undefined)),
      apply: vi.fn().mockReturnValue(of(undefined)),
    };
    snackBarSpy = { open: vi.fn() };

    TestBed.overrideComponent(JobCandidatesComponent, { set: { template: '' } });

    await TestBed.configureTestingModule({
      imports: [JobCandidatesComponent],
      providers: [
        provideRouter([]),
        { provide: JobsApiService, useValue: jobsApiSpy },
        { provide: CandidatesApiService, useValue: candidatesApiSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: { open: vi.fn() } },
        { provide: ActivatedRoute, useValue: makeActivatedRoute(jobId) },
      ],
    }).compileComponents();

    component = TestBed.createComponent(JobCandidatesComponent).componentInstance;
    component.ngOnInit();
  };

  describe('for job id 1', () => {
    beforeEach(async () => setupForJob('1'));

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load the correct job title from API', () => {
      expect(component.jobTitle).toBe('Senior Software Engineer');
    });

    it('should load the correct department from API', () => {
      expect(component.jobDepartment).toBe('Engineering');
    });

    it('should load candidates from API on init', () => {
      expect(component.allCandidates.length).toBe(2);
      expect(component.allCandidates[0].name).toBe('Harper Moore');
    });

    it('should populate dataSource with all candidates initially', () => {
      expect(component.dataSource.data.length).toBe(2);
    });

    it('should filter candidates by name when searchTerm is set', () => {
      component.searchTerm = 'Harper';
      component.applySearch();
      expect(component.dataSource.data.length).toBe(1);
      expect(component.dataSource.data[0].name).toBe('Harper Moore');
    });

    it('should filter candidates by email', () => {
      component.searchTerm = 'alex@email.com';
      component.applySearch();
      expect(component.dataSource.data.length).toBe(1);
    });

    it('should show all candidates when search is cleared', () => {
      component.searchTerm = 'no-match-xyz';
      component.applySearch();
      expect(component.dataSource.data.length).toBe(0);

      component.searchTerm = '';
      component.applySearch();
      expect(component.dataSource.data.length).toBe(2);
    });

    it('should filter candidates by stage', () => {
      component.setStageFilter('Interview');
      expect(component.dataSource.data.every(c => c.stage === 'Interview')).toBe(true);
    });

    it('should show all stages when filter is All', () => {
      component.setStageFilter('Interview');
      component.setStageFilter('All');
      expect(component.dataSource.data.length).toBe(component.allCandidates.length);
    });

    it('should call candidatesApi.updateStage on onStageChange', () => {
      const candidate = component.dataSource.data[0];
      component.onStageChange(candidate, 'Selected');
      expect(candidatesApiSpy.updateStage).toHaveBeenCalledWith(candidate.id, 'Selected');
    });

    it('should call deleteApplication after user confirms deletion', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const candidate = component.dataSource.data[0];
      component.deleteCandidate(candidate);
      expect(candidatesApiSpy.deleteApplication).toHaveBeenCalledWith(candidate.id);
    });

    it('should NOT call deleteApplication if user cancels confirmation', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const candidate = component.dataSource.data[0];
      component.deleteCandidate(candidate);
      expect(candidatesApiSpy.deleteApplication).not.toHaveBeenCalled();
    });

    it('should set loading to false after candidates load', () => {
      expect(component.loading()).toBe(false);
    });

    it('should handle API error gracefully and set loading to false', async () => {
      candidatesApiSpy.listByJob.mockReturnValue(throwError(() => new Error('Network error')));
      component.refresh();
      expect(component.loading()).toBe(false);
      expect(component.allCandidates.length).toBe(0);
    });
  });

  describe('for a non-existent job id', () => {
    beforeEach(async () => {
      await setupForJob('9999');
      // Simulate job not found
      jobsApiSpy.getJobById.mockReturnValue(throwError(() => new Error('Not found')));
      candidatesApiSpy.listByJob.mockReturnValue(of([]));
      component.ngOnInit();
    });

    it('should fallback job title when API errors', () => {
      expect(component.jobTitle).toBe('Job #9999');
    });

    it('should show no candidates for unknown job', () => {
      expect(component.dataSource.data.length).toBe(0);
    });
  });
});
