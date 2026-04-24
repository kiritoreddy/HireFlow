export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
export type InterviewType = 'TECHNICAL' | 'BEHAVIORAL' | 'HR' | 'SYSTEM_DESIGN';
export type Recommendation = 'STRONG_HIRE' | 'HIRE' | 'NO_HIRE' | 'STRONG_NO_HIRE';

export interface Interview {
  id: number;
  application_id: number;
  interviewer_id: number;
  scheduled_date: string; // RFC3339 UTC
  interview_type: InterviewType;
  status: InterviewStatus;
  interviewer?: {
    id?: number;
    name?: string;
    email?: string;
  };
  candidate_name?: string;
  job_title?: string;
  feedback?: InterviewFeedback;
}

export interface InterviewFeedback {
  id: number;
  interview_id: number;
  interviewer_id: number;
  rating: number;           // 1–5
  technical_score: number;  // 1–5
  communication: number;    // 1–5
  recommendation: Recommendation;
  comments?: string;
  submitted_at: string;
  interview?: Interview;
}

export interface FeedbackSubmit {
  rating: number;
  technical_score: number;
  communication: number;
  recommendation: Recommendation;
  comments?: string;
}
