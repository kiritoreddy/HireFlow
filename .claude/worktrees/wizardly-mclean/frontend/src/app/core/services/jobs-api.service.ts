import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { JOBS_ENDPOINTS } from '../config/api.config';
import { Job } from '../models/job.model';

/** Raw job row from GET /jobs (includes candidateCount fields). */
interface BackendJobListItem {
  id: number;
  title: string;
  description: string;
  department: string;
  location: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  candidateCount?: number;
  appliedCount?: number;
  interviewCount?: number;
  selectedCount?: number;
  rejectedCount?: number;
}

function mapListItem(b: BackendJobListItem): Job {
  const st = (b.status || 'Open') === 'Closed' ? 'Closed' : 'Open';
  return {
    id: b.id,
    title: b.title,
    description: b.description ?? '',
    department: b.department ?? '',
    location: b.location ?? '',
    status: st,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
    candidateCount: b.candidateCount,
    appliedCount: b.appliedCount,
    interviewCount: b.interviewCount,
    selectedCount: b.selectedCount,
    rejectedCount: b.rejectedCount,
  };
}

function mapJobBody(b: Record<string, unknown>): Job {
  const st = (String(b['status'] ?? 'Open')) === 'Closed' ? 'Closed' : 'Open';
  return {
    id: Number(b['id']),
    title: String(b['title'] ?? ''),
    description: String(b['description'] ?? ''),
    department: String(b['department'] ?? ''),
    location: String(b['location'] ?? ''),
    status: st,
    createdAt: typeof b['created_at'] === 'string' ? b['created_at'] : undefined,
    updatedAt: typeof b['updated_at'] === 'string' ? b['updated_at'] : undefined,
  };
}

@Injectable({ providedIn: 'root' })
export class JobsApiService {
  private http = inject(HttpClient);

  getJobs(): Observable<Job[]> {
    return this.http.get<BackendJobListItem[]>(JOBS_ENDPOINTS.list).pipe(map((list) => list.map(mapListItem)));
  }

  getJobById(id: number): Observable<Job> {
    return this.http.get<Record<string, unknown>>(JOBS_ENDPOINTS.byId(id)).pipe(map(mapJobBody));
  }

  createJob(payload: Pick<Job, 'title' | 'description' | 'department' | 'location' | 'status'>): Observable<Job> {
    const body = {
      title: payload.title,
      description: payload.description,
      department: payload.department,
      location: payload.location,
      status: payload.status,
    };
    return this.http.post<Record<string, unknown>>(JOBS_ENDPOINTS.list, body).pipe(map(mapJobBody));
  }

  updateJob(job: Job): Observable<Job> {
    const body = {
      id: job.id,
      title: job.title,
      description: job.description,
      department: job.department,
      location: job.location,
      status: job.status,
    };
    return this.http.put<Record<string, unknown>>(JOBS_ENDPOINTS.byId(job.id), body).pipe(map(mapJobBody));
  }

  deleteJob(id: number): Observable<void> {
    return this.http.delete(JOBS_ENDPOINTS.byId(id)).pipe(map(() => undefined));
  }
}
