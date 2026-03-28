/**
 * Entities for Performance Analytics and Smart Calendar outcomes.
 */

export type ApplicationStatus = "draft" | "applied" | "interview" | "offer" | "rejected" | "withdrawn";

export type CommunicationType =
  | "application_sent"
  | "interview_invitation"
  | "rejection"
  | "follow_up"
  | "offer"
  | "other";

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  appliedAt: string; // ISO
  status: ApplicationStatus;
  salaryRangeMin?: number;
  salaryRangeMax?: number;
  source?: string;
  jobUrl?: string;
}

export interface Communication {
  id: string;
  applicationId: string;
  type: CommunicationType;
  at: string; // ISO
  summary?: string;
}

export interface Interview {
  id: string;
  applicationId?: string;
  calendarEventId: string;
  eventTitle: string;
  eventEnd: string; // ISO
  /** Post-mortem: 1 = Stumbled, 2 = Average, 3 = Nailed it */
  pm_score?: 1 | 2 | 3;
  pmRecordedAt?: string; // ISO
}

export interface ActivityItem {
  id: string;
  at: string; // ISO
  type: "resume_analyzed" | "follow_up_drafted" | "application_tracked" | "interview_outcome" | "match_run";
  title: string;
  meta?: string; // e.g. company name
}

/** Virtual metrics (computed from applications + communications). */
export interface PerformanceMetrics {
  totalApplications: number;
  responseRate: number; // 0-100: (comms type=interview_invitation) / total applications
  ghostingRate: number; // 0-100: apps >14d old with no comms / total
  interviewToOfferRate: number; // 0-100: status=offer / status=interview (ever)
  interviewSuccessRate: number; // % of interviews that moved to next round (or offer)
  marketAlignment: number; // 0-100: salary_target vs landed roles (stub)
  responseRateTrend: "up" | "down" | "flat";
  interviewSuccessTrend: "up" | "down" | "flat";
  marketAlignmentTrend: "up" | "down" | "flat";
}
