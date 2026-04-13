/** Row from GET /api/candidate/applications (candidate’s own list). */
export interface MyApplication {
  id: string;
  jobId: number;
  jobTitle: string;
  department?: string;
  /** Pipeline status label (Applied, Interview, …). */
  stage: string;
  rawStatus?: string;
  /** ISO-8601 timestamp from backend `applied_at`. */
  appliedAt?: string;
}
