/** Candidate application for a job. Swap static data for API later. */
export type CandidateStage = 'Applied' | 'Interview' | 'Selected' | 'Rejected';

export interface JobCandidate {
  id: string;
  jobId: number;
  name: string;
  email: string;
  resume: string;
  stage: CandidateStage;
}
