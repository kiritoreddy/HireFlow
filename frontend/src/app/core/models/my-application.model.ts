/** Row from GET /api/candidate/me/applications */
export interface MyApplication {
  id: string;
  jobId: number;
  jobTitle: string;
  department?: string;
  stage: string;
  rawStatus?: string;
}
