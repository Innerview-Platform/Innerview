import type { BadgeTone } from '@/components/common/Badge'
import type { HireSignal, ReviewSummary } from '@/features/feedback/api/reviewsApi'

export const HIRE_SIGNAL_LABELS: Record<HireSignal, { label: string; tone: BadgeTone }> = {
  STRONG_YES: { label: 'Strong hire', tone: 'success' },
  YES: { label: 'Hire', tone: 'success' },
  LEAN_YES: { label: 'Lean hire', tone: 'primary' },
  LEAN_NO: { label: 'Lean no hire', tone: 'warning' },
  NO: { label: 'No hire', tone: 'danger' },
  STRONG_NO: { label: 'Strong no hire', tone: 'danger' },
}

/** "Interviewer", "Candidate" or "Observer" — the reviewer's role in that interview. */
export function reviewerRoleLabel(role: ReviewSummary['reviewer_role']): string | null {
  switch (role) {
    case 'INTERVIEWER':
      return 'Interviewer'
    case 'INTERVIEWEE':
      return 'Candidate'
    case 'OBSERVER':
      return 'Observer'
    default:
      return null
  }
}
