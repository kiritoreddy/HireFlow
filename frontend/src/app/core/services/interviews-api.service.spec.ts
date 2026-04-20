import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { InterviewsApiService } from './interviews-api.service';
import { INTERVIEW_ENDPOINTS, USERS_ENDPOINTS } from '../config/api.config';

describe('InterviewsApiService', () => {
  let service: InterviewsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InterviewsApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InterviewsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should list interviewers from users endpoint', () => {
    service.listInterviewers().subscribe((rows) => {
      expect(rows.length).toBe(1);
      expect(rows[0].role).toBe('interviewer');
      expect(rows[0].firstName).toBe('Alex');
    });

    const req = httpMock.expectOne(`${USERS_ENDPOINTS.list}?role=interviewer`);
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 10, name: 'Alex Doe', email: 'alex@hireflow.com', role: 'interviewer', is_active: true }]);
  });

  it('should assign interviewer', () => {
    service
      .assignInterviewer({
        application_id: '123',
        interviewer_id: '7',
        scheduled_date: '2026-05-01T10:00:00Z',
        interview_type: 'Technical',
      })
      .subscribe((value) => expect(value).toBeUndefined());

    const req = httpMock.expectOne(INTERVIEW_ENDPOINTS.create);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.application_id).toBe('123');
    req.flush({});
  });

  it('should map listByApplication response', () => {
    service.listByApplication('55').subscribe((rows) => {
      expect(rows.length).toBe(1);
      expect(rows[0].applicationId).toBe('55');
      expect(rows[0].status).toBe('Scheduled');
    });

    const req = httpMock.expectOne(INTERVIEW_ENDPOINTS.byApplication('55'));
    expect(req.request.method).toBe('GET');
    req.flush([
      {
        id: 1,
        application_id: 55,
        interviewer_id: 3,
        interviewer_name: 'Priya Kumar',
        status: 'scheduled',
      },
    ]);
  });

  it('should map feedback list response', () => {
    service.listFeedbackByApplication('77').subscribe((rows) => {
      expect(rows.length).toBe(1);
      expect(rows[0].technicalScore).toBe(4);
      expect(rows[0].recommendation).toBe('Hire');
    });

    const req = httpMock.expectOne(INTERVIEW_ENDPOINTS.feedbackByApplication('77'));
    expect(req.request.method).toBe('GET');
    req.flush([
      {
        id: 1,
        interview_id: 9,
        interviewer_id: 3,
        interviewer_name: 'Priya Kumar',
        rating: 4,
        technical_score: 4,
        communication: 5,
        recommendation: 'Hire',
      },
    ]);
  });
});
