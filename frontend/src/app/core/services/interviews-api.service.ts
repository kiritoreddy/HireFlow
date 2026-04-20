import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { INTERVIEW_ENDPOINTS, USERS_ENDPOINTS } from '../config/api.config';
import { Interview, InterviewFeedback, InterviewStatus } from '../models/interview.model';
import { User } from '../models/user.model';

interface BackendInterviewerRow {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active?: boolean;
}

interface BackendInterviewRow {
  id: number;
  application_id: string | number;
  interviewer_id: string | number;
  interviewer_name?: string;
  scheduled_date?: string;
  interview_type?: string;
  status?: string;
}

interface BackendFeedbackRow {
  id: number;
  interview_id: number;
  interviewer_id: string | number;
  interviewer_name?: string;
  rating: number;
  technical_score: number;
  communication: number;
  comments?: string;
  recommendation: string;
  submitted_at?: string;
}

interface AssignInterviewPayload {
  application_id: string;
  interviewer_id: string;
  scheduled_date?: string;
  interview_type?: string;
}

function mapStatus(value?: string): InterviewStatus {
  if (!value) return 'Pending';
  const normalized = value.toLowerCase();
  if (normalized === 'scheduled') return 'Scheduled';
  if (normalized === 'completed') return 'Completed';
  if (normalized === 'cancelled') return 'Cancelled';
  return 'Pending';
}

@Injectable({ providedIn: 'root' })
export class InterviewsApiService {
  private http = inject(HttpClient);

  listInterviewers(): Observable<User[]> {
    return this.http.get<BackendInterviewerRow[]>(`${USERS_ENDPOINTS.list}?role=interviewer`).pipe(
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
    return this.http.get<BackendInterviewRow[]>(INTERVIEW_ENDPOINTS.byApplication(applicationId)).pipe(
      map((rows) =>
        rows.map((row) => ({
          id: row.id,
          applicationId: String(row.application_id),
          interviewerId: String(row.interviewer_id),
          interviewerName: row.interviewer_name || `Interviewer #${row.interviewer_id}`,
          scheduledDate: row.scheduled_date,
          interviewType: row.interview_type,
          status: mapStatus(row.status),
        }))
      )
    );
  }

  listFeedbackByApplication(applicationId: string): Observable<InterviewFeedback[]> {
    return this.http
      .get<BackendFeedbackRow[]>(INTERVIEW_ENDPOINTS.feedbackByApplication(applicationId))
      .pipe(
        map((rows) =>
          rows.map((row) => ({
            id: row.id,
            interviewId: row.interview_id,
            interviewerId: String(row.interviewer_id),
            interviewerName: row.interviewer_name || `Interviewer #${row.interviewer_id}`,
            rating: row.rating,
            technicalScore: row.technical_score,
            communication: row.communication,
            comments: row.comments || '',
            recommendation: row.recommendation as InterviewFeedback['recommendation'],
            submittedAt: row.submitted_at,
          }))
        )
      );
  }
}
