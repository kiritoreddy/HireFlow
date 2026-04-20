import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { InterviewsApiService } from './interviews-api.service';
import { INTERVIEW_ENDPOINTS } from '../config/api.config';
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
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InterviewsApiService);
    http = TestBed.inject(HttpTestingController);
  });

  it('getMyInterviews() returns list from API', () => {
    let result: Interview[] = [];
    service.getMyInterviews().subscribe((data) => (result = data));
    http.expectOne(INTERVIEW_ENDPOINTS.myInterviews).flush([mockInterview]);
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
    expect(result).not.toBeNull();
    expect((result as unknown as Interview).id).toBe(1);
  });

  it('getInterview() returns null on error', () => {
    let result: Interview | null = mockInterview;
    service.getInterview(99).subscribe((data) => (result = data));
    http.expectOne(INTERVIEW_ENDPOINTS.byId(99)).error(new ErrorEvent('not found'));
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
