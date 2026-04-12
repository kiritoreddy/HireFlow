import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CANDIDATE_ENDPOINTS } from '../config/api.config';
import { CandidateStage, JobCandidate } from '../models/candidate.model';

interface BackendApplicationRow {
  id: string;
  job_id: number;
  name: string;
  email: string;
  resume: string;
  stage: string;
}

function mapRow(r: BackendApplicationRow): JobCandidate {
  const stage = (['Applied', 'Interview', 'Selected', 'Rejected'] as const).includes(r.stage as CandidateStage)
    ? (r.stage as CandidateStage)
    : 'Applied';
  return {
    id: r.id,
    jobId: r.job_id,
    name: r.name,
    email: r.email,
    resume: r.resume || '—',
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

  apply(payload: { job_id: number; name: string; email: string; resume_path?: string }): Observable<void> {
    return this.http.post(CANDIDATE_ENDPOINTS.apply, payload).pipe(map(() => undefined));
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
}
