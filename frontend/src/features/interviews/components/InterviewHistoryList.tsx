import { Link } from 'react-router-dom'
import { Badge, type BadgeTone } from '@/components/common/Badge'
import { INTERVIEW_TYPE_LABELS, labelFor } from '@/constants/enums'
import { ROOM_ROLE_LABELS } from '@/features/room/utils/labels'
import { paths } from '@/routes/paths'
import type { InterviewHistoryItem } from '@/features/interviews/types'
import { formatDateTime, formatDuration } from '@/lib/utils'

const roleTone: Record<string, BadgeTone> = { INTERVIEWER: 'primary', INTERVIEWEE: 'success', OBSERVER: 'neutral' }
const roleLabel = (role: string) => labelFor(ROOM_ROLE_LABELS as Record<string, string>, role)

/** Table on wide screens, stacked cards on small screens. */
export function InterviewHistoryList({ items }: { items: InterviewHistoryItem[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-fg-muted uppercase">
              <th scope="col" className="px-5 py-3 font-medium">Interview</th>
              <th scope="col" className="px-5 py-3 font-medium">Type</th>
              <th scope="col" className="px-5 py-3 font-medium">Your role</th>
              <th scope="col" className="px-5 py-3 font-medium">Start time</th>
              <th scope="col" className="px-5 py-3 text-right font-medium">Duration</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.interview_id} className="border-b border-border-subtle last:border-0 hover:bg-elevated/50">
                <td className="px-5 py-3.5 font-mono text-[13px] text-fg-secondary">
                  <Link to={paths.interview(item.interview_id)} className="hover:text-fg hover:underline">
                    #{item.interview_id}
                  </Link>
                </td>
                <td className="px-5 py-3.5 font-medium">
                  <Link to={paths.interview(item.interview_id)} className="hover:underline">
                    {labelFor(INTERVIEW_TYPE_LABELS, item.type)}
                  </Link>
                </td>
                <td className="px-5 py-3.5">
                  <Badge tone={roleTone[item.role] ?? 'neutral'}>{roleLabel(item.role)}</Badge>
                </td>
                <td className="px-5 py-3.5 text-fg-secondary">{formatDateTime(item.start_time)}</td>
                <td className="px-5 py-3.5 text-right text-fg-secondary">{formatDuration(item.duration_minutes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-border-subtle md:hidden">
        {items.map((item) => (
          <li key={item.interview_id} className="flex items-start justify-between gap-3 px-5 py-4">
            <div className="min-w-0">
              <Link to={paths.interview(item.interview_id)} className="font-medium hover:underline">
                {labelFor(INTERVIEW_TYPE_LABELS, item.type)}
              </Link>
              <p className="mt-0.5 text-[13px] text-fg-muted">
                {formatDateTime(item.start_time)} · {formatDuration(item.duration_minutes)}
              </p>
            </div>
            <Badge tone={roleTone[item.role] ?? 'neutral'}>{roleLabel(item.role)}</Badge>
          </li>
        ))}
      </ul>
    </>
  )
}
