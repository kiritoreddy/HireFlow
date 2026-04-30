import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap, throwError, timeout } from 'rxjs';
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
    const params = new HttpParams().set('role', 'interviewer');
    return this.http
      .get<Array<{ id: number; name: string; email: string; is_active?: boolean }>>(USERS_ENDPOINTS.list, {
        params,
      })
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
    const applicationId = Number(payload.application_id);
    const interviewerId = Number(payload.interviewer_id);
    if (!Number.isFinite(applicationId) || applicationId <= 0 || !Number.isFinite(interviewerId) || interviewerId <= 0) {
      return throwError(() => new Error('Invalid application or interviewer id'));
    }
    // Backend expects JSON numbers for uint fields (strings fail json.Unmarshal in Go).
    return this.http
      .post(INTERVIEW_ENDPOINTS.create, {
        application_id: applicationId,
        interviewer_id: interviewerId,
        scheduled_date: payload.scheduled_date,
        interview_type: payload.interview_type,
      })
      .pipe(map(() => undefined));
  }

  /** Full interview list for hiring_manager / admin (used for availability when assigning). */
  listAllInterviews(): Observable<Interview[]> {
    return this.http.get<Interview[]>(INTERVIEW_ENDPOINTS.list).pipe(
      map((rows) => (Array.isArray(rows) ? rows : [])),
      catchError(() => of([]))
    );
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

  /**
   * Interviewer assignment list. Uses a single GET — no per-row feedback fan-out.
   * (Fan-out via forkJoin could hang the dashboard if any feedback request stalled or never emitted.)
   * Feedback is loaded on the feedback detail route via {@link getInterview}.
   */
  getMyInterviews(): Observable<Interview[]> {
    return this.http.get<Interview[]>(INTERVIEW_ENDPOINTS.myInterviews).pipe(
      timeout(25_000),
      map((rows) => (Array.isArray(rows) ? rows : [])),
      catchError((err: unknown) => {
        const name = err && typeof err === 'object' && 'name' in err ? String((err as { name: string }).name) : '';
        if (name === 'TimeoutError') {
          return throwError(
            () => new Error('Timed out waiting for interviews. Check that the API is running and reachable.')
          );
        }
        return of([]);
      })
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
