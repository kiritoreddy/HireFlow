import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { JobsApiService } from './jobs-api.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { JOBS_ENDPOINTS } from '../config/api.config';

describe('JobsApiService', () => {
  let service: JobsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        JobsApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(JobsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getJobs() should GET the jobs list endpoint', () => {
    const mockJobs = [
      { id: 1, title: 'Engineer', department: 'Eng', location: 'Remote', description: '', status: 'Open' },
    ];

    service.getJobs().subscribe(jobs => {
      expect(jobs.length).toBe(1);
      expect(jobs[0].title).toBe('Engineer');
    });

    const req = httpMock.expectOne(JOBS_ENDPOINTS.list);
    expect(req.request.method).toBe('GET');
    req.flush(mockJobs);
  });

  it('getJobById() should GET a single job by id', () => {
    const mockJob = { id: 2, title: 'Designer', department: 'Design', location: 'NYC', description: '', status: 'Open' };

    service.getJobById(2).subscribe(job => {
      expect(job.id).toBe(2);
    });

    const req = httpMock.expectOne(JOBS_ENDPOINTS.byId(2));
    expect(req.request.method).toBe('GET');
    req.flush(mockJob);
  });

  it('createJob() should POST to the jobs list endpoint', () => {
    const payload = { title: 'PM', department: 'Product', location: 'SF', description: 'Lead product', status: 'Open' as const };

    service.createJob(payload).subscribe();

    const req = httpMock.expectOne(JOBS_ENDPOINTS.list);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.title).toBe('PM');
    req.flush({ id: 3, ...payload });
  });

  it('updateJob() should PUT to the job by-id endpoint', () => {
    const job = { id: 3, title: 'Senior PM', department: 'Product', location: 'SF', description: '', status: 'Open' as const };

    service.updateJob(job).subscribe();

    const req = httpMock.expectOne(JOBS_ENDPOINTS.byId(3));
    expect(req.request.method).toBe('PUT');
    req.flush(job);
  });

  it('deleteJob() should DELETE the job by-id endpoint', () => {
    service.deleteJob(4).subscribe();

    const req = httpMock.expectOne(JOBS_ENDPOINTS.byId(4));
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
