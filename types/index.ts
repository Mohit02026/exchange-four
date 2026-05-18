export type Role = 'APPLICANT' | 'HR' | 'EXECUTIVE'

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CSW_GENERATED'
  | 'SENT_TO_AVI'
  | 'EXECUTIVE_APPROVED'
  | 'EXECUTIVE_DISAPPROVED'
  | 'INTERVIEW_SCHEDULED'
  | 'START_DATE_REQUESTED'
  | 'HIRED'
  | 'REJECTED'
  | 'FUTURE_PROSPECT'

export type OnboardingTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETE'

export type PositionStatus = 'DRAFT' | 'OPEN' | 'PAUSED' | 'FILLED' | 'CLOSED'
