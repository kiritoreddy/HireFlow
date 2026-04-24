import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CANDIDATE_ENDPOINTS } from '../config/api.config';
import { CandidateStage, JobCandidate } from '../models/candidate.model';
import { MyApplication } from '../models/my-application.model';

interface BackendApplicationRow {
  id: string | number;
  job_id: number;
  name?: string;
  email?: string;
  resume?: string;
  stage?: string;
  status?: string;
  candidate?: {
    name?: string;
    email?: string;
    resume_path?: string;
  };
}

interface BackendMyApplicationRow {
  id: string;
  job_id: number;
  job_title: string;
  department?: string;
  stage: string;
  raw_status?: string;
  applied_at?: string;
}

function mapRow(r: BackendApplicationRow): JobCandidate {
  const backendStage = r.stage ?? r.status ?? '';
  const normalized = backendStage.toUpperCase();
  const stage: CandidateStage =
    normalized === 'INTERVIEW'
      ? 'Interview'
      : normalized === 'SELECTED'
        ? 'Selected'
        : normalized === 'REJECTED'
          ? 'Rejected'
          : 'Applied';
  return {
    id: String(r.id),
    jobId: r.job_id,
    name: r.name || r.candidate?.name || 'Candidate',
    email: r.email || r.candidate?.email || 'unknown@email.com',
    resume: r.resume || r.candidate?.resume_path || '—',
    stage,
  };
}

@Injectable({ providedIn: 'root' })
export class CandidatesApiService {
  private http = inject(HttpClient);

  listByJob(jobId: number): Observable<JobCandidate[]> {
    return this.http
      .get<BackendApplicationRow[]>(CANDIDATE_ENDPOINTS.byJob(jobId))
      .pipe(map((rows) => rows.map(mapRow)));
  }

  /**
   * Submit application. Candidate portal sends a `resume` file (multipart). JSON body is still
   * supported for tests and legacy callers (expects `email` + optional `resume_path` string).
   */
  apply(
    payload:
      | { job_id: number; name: string; resume: File }
      | { job_id: number; name: string; email: string; resume_path?: string }
  ): Observable<void> {
    if ('resume' in payload) {
      const fd = new FormData();
      fd.set('job_id', String(payload.job_id));
      fd.set('name', payload.name);
      fd.set('resume', payload.resume, payload.resume.name);
      return this.http.post(CANDIDATE_ENDPOINTS.apply, fd).pipe(map(() => undefined));
    }
    return this.http
      .post(CANDIDATE_ENDPOINTS.apply, {
        job_id: payload.job_id,
        name: payload.name,
        email: payload.email,
        resume_path: payload.resume_path,
      })
      .pipe(map(() => undefined));
  }

  updateStage(applicationId: string, stage: CandidateStage): Observable<void> {
    return this.http
      .patch(CANDIDATE_ENDPOINTS.stage(applicationId), { stage })
      .pipe(map(() => undefined));
  }

  deleteApplication(applicationId: string): Observable<void> {
    return this.http
      .delete(CANDIDATE_ENDPOINTS.delete(applicationId))
      .pipe(map(() => undefined));
  }

  listMyApplications(): Observable<MyApplication[]> {
    return this.http.get<BackendMyApplicationRow[]>(CANDIDATE_ENDPOINTS.myApplications).pipe(
      map((rows) =>
        rows.map((r) => ({
          id: r.id,
          jobId: r.job_id,
          jobTitle: r.job_title || '—',
          department: r.department,
          stage: r.stage,
          rawStatus: r.raw_status,
          appliedAt: r.applied_at,
        }))
      )
    );
  }

  withdraw(applicationId: string): Observable<void> {
    return this.http.patch(CANDIDATE_ENDPOINTS.withdraw(applicationId), {}).pipe(map(() => undefined));
  }
}
