import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { APPLICATIONS_ENDPOINTS, JOBS_ENDPOINTS } from '../config/api.config';
import { JobCandidate, CandidateStage } from '../models/candidate.model';

interface ApplicationRow {
  id: string;
  jobId: number;
  name: string;
  email: string;
  resume: string;
  stage: CandidateStage;
  updated_at: string;
}

function rowToCandidate(r: ApplicationRow): JobCandidate {
  return {
    id: r.id,
    jobId: r.jobId,
    name: r.name,
    email: r.email,
    resume: r.resume,
    stage: r.stage,
  };
}

@Injectable({ providedIn: 'root' })
export class JobApplicationsApiService {
  private http = inject(HttpClient);

  listForJob(jobId: number): Observable<JobCandidate[]> {
    return this.http
      .get<ApplicationRow[]>(JOBS_ENDPOINTS.applications(jobId))
      .pipe(map((rows) => rows.map(rowToCandidate)));
  }

  createForJob(
    jobId: number,
    body: { name: string; email: string; resume: string }
  ): Observable<JobCandidate> {
    return this.http
      .post<ApplicationRow>(JOBS_ENDPOINTS.applications(jobId), body)
      .pipe(map(rowToCandidate));
  }

  updateStage(applicationId: string, stage: CandidateStage): Observable<JobCandidate> {
    return this.http
      .patch<ApplicationRow>(APPLICATIONS_ENDPOINTS.patch(applicationId), { stage })
      .pipe(map(rowToCandidate));
  }
}
