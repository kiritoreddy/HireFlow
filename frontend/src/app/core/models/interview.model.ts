export type InterviewStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'Pending';

export interface Interview {
  id: number;
  applicationId: string;
  interviewerId: string;
  interviewerName: string;
  scheduledDate?: string;
  interviewType?: string;
  status: InterviewStatus;
}

export type FeedbackRecommendation = 'Strong Hire' | 'Hire' | 'No Hire' | 'Strong No Hire';

export interface InterviewFeedback {
  id: number;
  interviewId: number;
  interviewerId: string;
  interviewerName: string;
  rating: number;
  technicalScore: number;
  communication: number;
  comments: string;
  recommendation: FeedbackRecommendation;
  submittedAt?: string;
}
