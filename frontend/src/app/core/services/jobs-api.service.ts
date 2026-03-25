import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { JOBS_ENDPOINTS } from '../config/api.config';
import { Job } from '../models/job.model';

interface JobDetailBody {
  id: number;
  title: string;
  description: string;
  department: string;
  location: string;
  status: string;
}

interface JobListRow extends JobDetailBody {
  created_at: string;
  updated_at: string;
  candidateCount: number;
  appliedCount: number;
  interviewCount: number;
  selectedCount: number;
  rejectedCount: number;
}

function rowToJob(r: JobListRow): Job {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? '',
    department: r.department ?? '',
    location: r.location ?? '',
    status: (r.status === 'Closed' ? 'Closed' : 'Open') as Job['status'],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    candidateCount: r.candidateCount,
    appliedCount: r.appliedCount,
    interviewCount: r.interviewCount,
    selectedCount: r.selectedCount,
    rejectedCount: r.rejectedCount,
  };
}

@Injectable({ providedIn: 'root' })
export class JobsApiService {
  private http = inject(HttpClient);

  list(): Observable<Job[]> {
    return this.http.get<JobListRow[]>(JOBS_ENDPOINTS.list).pipe(map((rows) => rows.map(rowToJob)));
  }

  getById(id: number): Observable<Job> {
    return this.http.get<JobDetailBody>(JOBS_ENDPOINTS.detail(id)).pipe(
      map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description ?? '',
        department: r.department ?? '',
        location: r.location ?? '',
        status: (r.status === 'Closed' ? 'Closed' : 'Open') as Job['status'],
      }))
    );
  }

  private detailToJob(r: JobDetailBody): Job {
    return {
      id: r.id,
      title: r.title,
      description: r.description ?? '',
      department: r.department ?? '',
      location: r.location ?? '',
      status: (r.status === 'Closed' ? 'Closed' : 'Open') as Job['status'],
    };
  }

  create(job: Pick<Job, 'title' | 'description' | 'department' | 'location' | 'status'>): Observable<Job> {
    const body = {
      title: job.title,
      description: job.description,
      department: job.department,
      location: job.location,
      status: job.status,
    };
    return this.http.post<JobDetailBody>(JOBS_ENDPOINTS.list, body).pipe(map((r) => this.detailToJob(r)));
  }

  update(id: number, job: Partial<Pick<Job, 'title' | 'description' | 'department' | 'location' | 'status'>>): Observable<Job> {
    return this.http
      .put<JobDetailBody>(JOBS_ENDPOINTS.detail(id), { id, ...job })
      .pipe(map((r) => this.detailToJob(r)));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(JOBS_ENDPOINTS.detail(id));
  }
}
