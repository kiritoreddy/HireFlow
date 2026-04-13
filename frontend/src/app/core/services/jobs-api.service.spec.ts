import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { JOBS_ENDPOINTS } from '../config/api.config';
import { JobsApiService } from './jobs-api.service';

describe('JobsApiService', () => {
  let service: JobsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), JobsApiService],
    });
    service = TestBed.inject(JobsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getJobs maps rows to Job', async () => {
    const row = {
      id: 1,
      title: 'T',
      description: 'd',
      department: 'dep',
      location: 'loc',
      status: 'Open',
      created_at: 'a',
      updated_at: 'b',
      candidateCount: 2,
      appliedCount: 1,
      interviewCount: 0,
      selectedCount: 1,
      rejectedCount: 0,
    };

    const promise = firstValueFrom(service.getJobs());
    const req = httpMock.expectOne(JOBS_ENDPOINTS.list);
    expect(req.request.method).toBe('GET');
    req.flush([row]);
    const jobs = await promise;
    expect(jobs.length).toBe(1);
    expect(jobs[0]).toMatchObject({
      id: 1,
      title: 'T',
      candidateCount: 2,
      appliedCount: 1,
      status: 'Open',
    });
  });

  it('createJob posts body and maps response', async () => {
    const promise = firstValueFrom(
      service.createJob({
        title: 'New',
        description: 'x',
        department: 'd',
        location: 'l',
        status: 'Open',
      })
    );
    const req = httpMock.expectOne(JOBS_ENDPOINTS.list);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toMatchObject({ title: 'New', status: 'Open' });
    req.flush({
      id: 9,
      title: 'New',
      description: 'x',
      department: 'd',
      location: 'l',
      status: 'Open',
    });
    const j = await promise;
    expect(j.title).toBe('New');
  });
});
