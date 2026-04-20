import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DASHBOARD_ENDPOINTS } from '../config/api.config';

export interface DepartmentStat {
  department: string;
  openCount: number;
  closedCount: number;
}

export interface DashboardStats {
  totalJobs: number;
  openJobs: number;
  closedJobs: number;
  totalCandidates: number;
  totalUsers: number;
  totalInterviews?: number;
  pendingInterviews?: number;
  completedInterviews?: number;
  departmentSummary: DepartmentStat[];
}

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private http = inject(HttpClient);

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(DASHBOARD_ENDPOINTS.stats);
  }
}
