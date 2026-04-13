/** Candidate application row (hiring pipeline / job detail). */
export type CandidateStage = 'Applied' | 'Interview' | 'Selected' | 'Rejected';

export interface JobCandidate {
  id: string;
  jobId: number;
  name: string;
  email: string;
  resume: string;
  stage: CandidateStage;
}
