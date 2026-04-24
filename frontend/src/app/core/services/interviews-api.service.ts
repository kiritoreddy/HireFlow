import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap, forkJoin } from 'rxjs';
import { Interview, InterviewFeedback, FeedbackSubmit } from '../models/interview.model';
import { INTERVIEW_ENDPOINTS, USERS_ENDPOINTS } from '../config/api.config';
import { User } from '../models/user.model';

interface AssignInterviewPayload {
  application_id: string;
  interviewer_id: string;
  scheduled_date: string;
  interview_type: string;
}

export interface FeedbackResult {
  success: boolean;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class InterviewsApiService {
  private http = inject(HttpClient);

  listInterviewers(): Observable<User[]> {
    return this.http
      .get<Array<{ id: number; name: string; email: string; is_active?: boolean }>>(
        `${USERS_ENDPOINTS.list}?role=interviewer`
      )
      .pipe(
        map((rows) =>
          rows.map((row) => {
            const parts = (row.name || '').trim().split(/\s+/);
            return {
              id: String(row.id),
              firstName: parts[0] ?? '',
              lastName: parts.slice(1).join(' '),
              email: row.email,
              role: 'interviewer',
              isActive: row.is_active ?? true,
            } satisfies User;
          })
        )
      );
  }

  assignInterviewer(payload: AssignInterviewPayload): Observable<void> {
    return this.http.post(INTERVIEW_ENDPOINTS.create, payload).pipe(map(() => undefined));
  }

  listByApplication(applicationId: string): Observable<Interview[]> {
    return this.http.get<Interview[]>(INTERVIEW_ENDPOINTS.byApplication(applicationId)).pipe(
      catchError(() => of([]))
    );
  }

  listFeedbackByApplication(applicationId: string): Observable<InterviewFeedback[]> {
    return this.http.get<InterviewFeedback[]>(INTERVIEW_ENDPOINTS.feedbackByApplication(applicationId)).pipe(
      catchError(() => of([]))
    );
  }

  getMyInterviews(): Observable<Interview[]> {
    return this.http.get<Interview[]>(INTERVIEW_ENDPOINTS.myInterviews).pipe(
      switchMap((interviews) => {
        if (interviews.length === 0) return of([]);
        return forkJoin(
          interviews.map((interview) =>
            this.getInterviewFeedback(interview.id).pipe(
              map((feedback) => ({ ...interview, feedback: feedback ?? interview.feedback }))
            )
          )
        );
      }),
      catchError(() => of([]))
    );
  }

  getInterview(id: number): Observable<Interview | null> {
    return this.http.get<Interview>(INTERVIEW_ENDPOINTS.byId(id)).pipe(
      switchMap((interview) =>
        this.getInterviewFeedback(id).pipe(
          map((feedback) => ({ ...interview, feedback: feedback ?? interview.feedback }))
        )
      ),
      catchError(() => of(null))
    );
  }

  getInterviewFeedback(interviewId: number): Observable<InterviewFeedback | null> {
    return this.http.get<InterviewFeedback>(INTERVIEW_ENDPOINTS.feedback(interviewId)).pipe(
      catchError(() => of(null))
    );
  }

  submitFeedback(interviewId: number, payload: FeedbackSubmit): Observable<FeedbackResult> {
    return this.http.post<InterviewFeedback>(INTERVIEW_ENDPOINTS.feedback(interviewId), payload).pipe(
      map(() => ({ success: true } as FeedbackResult)),
      catchError((err) => {
        const msg = err?.error?.error ?? 'Failed to submit feedback. Please try again.';
        return of({ success: false, error: msg });
      })
    );
  }
}
