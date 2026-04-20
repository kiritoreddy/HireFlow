import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Interview, InterviewFeedback, FeedbackSubmit } from '../models/interview.model';
import { INTERVIEW_ENDPOINTS } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class InterviewsApiService {
  private http = inject(HttpClient);

  /** Get all interviews assigned to the currently logged-in interviewer. */
  getMyInterviews(): Observable<Interview[]> {
    return this.http.get<Interview[]>(INTERVIEW_ENDPOINTS.myInterviews).pipe(
      catchError(() => of([]))
    );
  }

  /** Get a single interview by id. */
  getInterview(id: number): Observable<Interview | null> {
    return this.http.get<Interview>(INTERVIEW_ENDPOINTS.byId(id)).pipe(
      catchError(() => of(null))
    );
  }

  /** Submit feedback for an interview. */
  submitFeedback(interviewId: number, payload: FeedbackSubmit): Observable<{ success: boolean; error?: string }> {
    return this.http.post<InterviewFeedback>(INTERVIEW_ENDPOINTS.feedback(interviewId), payload).pipe(
      catchError((err) => {
        const msg = err?.error?.error ?? 'Failed to submit feedback. Please try again.';
        return of({ success: false, error: msg } as never);
      }),
      // Map success to our standard shape
      catchError(() => of({ success: false, error: 'Unexpected error.' }))
    );
  }
}
