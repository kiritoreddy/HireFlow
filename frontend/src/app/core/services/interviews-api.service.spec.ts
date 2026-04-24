import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { InterviewsApiService } from './interviews-api.service';
import { INTERVIEW_ENDPOINTS, USERS_ENDPOINTS } from '../config/api.config';
import { Interview } from '../models/interview.model';

const mockInterview: Interview = {
  id: 1,
  application_id: 10,
  interviewer_id: 3,
  scheduled_date: '2026-05-01T10:00:00Z',
  interview_type: 'TECHNICAL',
  status: 'SCHEDULED',
  candidate_name: 'Jane Doe',
  job_title: 'Frontend Engineer',
};

describe('InterviewsApiService', () => {
  let service: InterviewsApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InterviewsApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InterviewsApiService);
    http = TestBed.inject(HttpTestingController);
  });

  it('listInterviewers() returns interviewer users list', () => {
    let result: any[] = [];
    service.listInterviewers().subscribe((data) => (result = data));
    http.expectOne(`${USERS_ENDPOINTS.list}?role=interviewer`).flush([
      { id: 5, name: 'Alex Doe', email: 'alex@hireflow.com', is_active: true },
    ]);
    expect(result.length).toBe(1);
    expect(result[0].role).toBe('interviewer');
  });

  it('assignInterviewer() posts assignment payload', () => {
    service
      .assignInterviewer({
        application_id: '10',
        interviewer_id: '5',
        scheduled_date: '2026-05-01T10:00:00Z',
        interview_type: 'TECHNICAL',
      })
      .subscribe((result) => expect(result).toBeUndefined());
    const req = http.expectOne(INTERVIEW_ENDPOINTS.create);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.application_id).toBe('10');
    req.flush({});
  });

  it('listByApplication() returns [] on error', () => {
    let result: Interview[] = [];
    service.listByApplication('99').subscribe((data) => (result = data));
    http.expectOne(INTERVIEW_ENDPOINTS.byApplication('99')).error(new ErrorEvent('network error'));
    expect(result).toEqual([]);
  });

  it('listFeedbackByApplication() returns [] on error', () => {
    let result: any[] = [];
    service.listFeedbackByApplication('99').subscribe((data) => (result = data));
    http.expectOne(INTERVIEW_ENDPOINTS.feedbackByApplication('99')).error(new ErrorEvent('network error'));
    expect(result).toEqual([]);
  });

  it('getMyInterviews() returns list from API', () => {
    let result: Interview[] = [];
    service.getMyInterviews().subscribe((data) => (result = data));
    http.expectOne(INTERVIEW_ENDPOINTS.myInterviews).flush([mockInterview]);
    http.expectOne(INTERVIEW_ENDPOINTS.feedback(1)).flush(
      { id: 1, interview_id: 1, interviewer_id: 3, rating: 4, technical_score: 4, communication: 3, recommendation: 'HIRE', submitted_at: '2026-05-01T11:00:00Z' }
    );
    expect(result.length).toBe(1);
    expect(result[0].candidate_name).toBe('Jane Doe');
  });

  it('getMyInterviews() returns empty array on error', () => {
    let result: Interview[] = [];
    service.getMyInterviews().subscribe((data) => (result = data));
    http.expectOne(INTERVIEW_ENDPOINTS.myInterviews).error(new ErrorEvent('network error'));
    expect(result).toEqual([]);
  });

  it('getInterview() returns single interview by id', () => {
    let result: Interview | null = null;
    service.getInterview(1).subscribe((data) => (result = data));
    http.expectOne(INTERVIEW_ENDPOINTS.byId(1)).flush(mockInterview);
    http.expectOne(INTERVIEW_ENDPOINTS.feedback(1)).flush(
      { id: 1, interview_id: 1, interviewer_id: 3, rating: 4, technical_score: 4, communication: 3, recommendation: 'HIRE', submitted_at: '2026-05-01T11:00:00Z' }
    );
    expect(result).not.toBeNull();
    expect((result as unknown as Interview).id).toBe(1);
  });

  it('getInterview() returns null on error', () => {
    let result: Interview | null = mockInterview;
    service.getInterview(99).subscribe((data) => (result = data));
    http.expectOne(INTERVIEW_ENDPOINTS.byId(99)).error(new ErrorEvent('not found'));
    expect(result).toBeNull();
  });

  it('getInterviewFeedback() returns null on error', () => {
    let result: any = undefined;
    service.getInterviewFeedback(99).subscribe((data) => (result = data));
    http.expectOne(INTERVIEW_ENDPOINTS.feedback(99)).error(new ErrorEvent('not found'));
    expect(result).toBeNull();
  });

  it('submitFeedback() returns success true on 200', () => {
    let result: any;
    service.submitFeedback(1, {
      rating: 4,
      technical_score: 4,
      communication: 3,
      recommendation: 'HIRE',
    }).subscribe((r) => (result = r));
    http.expectOne(INTERVIEW_ENDPOINTS.feedback(1)).flush({ id: 1 });
    expect(result.success).toBe(true);
  });

  it('submitFeedback() returns success false with error message on failure', () => {
    let result: any;
    service.submitFeedback(1, {
      rating: 4,
      technical_score: 4,
      communication: 3,
      recommendation: 'HIRE',
    }).subscribe((r) => (result = r));
    http.expectOne(INTERVIEW_ENDPOINTS.feedback(1)).flush(
      { error: 'Feedback already submitted' },
      { status: 409, statusText: 'Conflict' }
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('Feedback already submitted');
  });
});
