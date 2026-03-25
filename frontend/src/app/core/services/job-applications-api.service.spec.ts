import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { APPLICATIONS_ENDPOINTS, JOBS_ENDPOINTS } from '../config/api.config';
import { JobApplicationsApiService } from './job-applications-api.service';

describe('JobApplicationsApiService', () => {
  let service: JobApplicationsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), JobApplicationsApiService],
    });
    service = TestBed.inject(JobApplicationsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('listForJob GETs and maps rows', async () => {
    const promise = firstValueFrom(service.listForJob(5));
    const req = httpMock.expectOne(JOBS_ENDPOINTS.applications(5));
    expect(req.request.method).toBe('GET');
    req.flush([
      {
        id: 'a1',
        jobId: 5,
        name: 'N',
        email: 'e@x.com',
        resume: 'r',
        stage: 'Applied',
        updated_at: 't',
      },
    ]);
    const cands = await promise;
    expect(cands.length).toBe(1);
    expect(cands[0]).toMatchObject({ id: 'a1', jobId: 5, stage: 'Applied' });
  });

  it('updateStage PATCHes stage', async () => {
    const promise = firstValueFrom(service.updateStage('x', 'Interview'));
    const req = httpMock.expectOne(APPLICATIONS_ENDPOINTS.patch('x'));
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ stage: 'Interview' });
    req.flush({
      id: 'x',
      jobId: 1,
      name: 'N',
      email: 'e',
      resume: '',
      stage: 'Interview',
      updated_at: 't',
    });
    const c = await promise;
    expect(c.stage).toBe('Interview');
  });
});
