/** Job model – aligned with backend GET /jobs response. */
export interface Job {
  id: number;
  title: string;
  description: string;
  department: string;
  location: string;
  status: 'Open' | 'Closed';
  createdAt?: string;
  updatedAt?: string;
  candidateCount?: number;
  appliedCount?: number;
  interviewCount?: number;
  selectedCount?: number;
  rejectedCount?: number;
}
