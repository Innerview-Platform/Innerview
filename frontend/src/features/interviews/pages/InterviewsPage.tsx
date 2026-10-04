import { Link, useSearchParams } from 'react-router-dom'
import { CalendarPlus, FilterX, History } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import { Button, buttonClasses } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { SkeletonRows } from '@/components/common/Skeleton'
import { EmptyState, ErrorState } from '@/components/feedback/states'
import { Select } from '@/components/forms/controls'
import { PageHeader } from '@/components/layout/PageHeader'
import { Pagination } from '@/components/tables/Pagination'
import {
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_STATUSES,
  INTERVIEW_TYPE_LABELS,
  INTERVIEW_TYPES,
  type InterviewStatus,
  type InterviewType,
} from '@/constants/enums'
import { selectCurrentUser } from '@/features/auth/slices/authSlice'
import { InterviewHistoryList } from '@/features/interviews/components/InterviewHistoryList'
import { useInterviewHistory } from '@/features/interviews/hooks/useInterviews'
import { ProfileRequired } from '@/features/profile/components/ProfileRequired'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { paths } from '@/routes/paths'

const PAGE_SIZE = 10

const parseEnum = <T extends string>(values: readonly T[], raw: string | null): T | undefined =>
  values.includes(raw as T) ? (raw as T) : undefined

export default function InterviewsPage() {
  useDocumentTitle('Interview history')
  return (
    <>
      <PageHeader
        title="Interview history"
        description="Every interview session you've taken part in."
        actions={
          <Link to={paths.newInterview} className={buttonClasses()}>
            <CalendarPlus className="h-4 w-4" /> New interview
          </Link>
        }
      />
      <ProfileRequired feature="your interview history">
        <InterviewHistory />
      </ProfileRequired>
    </>
  )
}

function InterviewHistory() {
  const user = useAppSelector(selectCurrentUser)!
  const [searchParams, setSearchParams] = useSearchParams()
  const status = parseEnum<InterviewStatus>(INTERVIEW_STATUSES, searchParams.get('status'))
  const type = parseEnum<InterviewType>(INTERVIEW_TYPES, searchParams.get('type'))
  const page = Math.max(0, Number(searchParams.get('page')) || 0)

  const history = useInterviewHistory(user.id, { status, type, page, limit: PAGE_SIZE })

  const updateParams = (changes: Record<string, string | undefined>) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      for (const [key, value] of Object.entries(changes)) {
        if (value) next.set(key, value)
        else next.delete(key)
      }
      return next
    })
  }
  const hasFilters = Boolean(status || type)

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3.5">
        <label className="sr-only" htmlFor="filter-status">
          Status
        </label>
        <Select id="filter-status" className="h-9 w-auto min-w-40" value={status ?? ''} onChange={(e) => updateParams({ status: e.target.value, page: undefined })}>
          <option value="">All statuses</option>
          {INTERVIEW_STATUSES.map((value) => (
            <option key={value} value={value}>
              {INTERVIEW_STATUS_LABELS[value]}
            </option>
          ))}
        </Select>
        <label className="sr-only" htmlFor="filter-type">
          Type
        </label>
        <Select id="filter-type" className="h-9 w-auto min-w-40" value={type ?? ''} onChange={(e) => updateParams({ type: e.target.value, page: undefined })}>
          <option value="">All types</option>
          {INTERVIEW_TYPES.map((value) => (
            <option key={value} value={value}>
              {INTERVIEW_TYPE_LABELS[value]}
            </option>
          ))}
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => setSearchParams({})} leftIcon={<FilterX className="h-3.5 w-3.5" />}>
            Clear filters
          </Button>
        )}
      </div>

      {history.isPending ? (
        <SkeletonRows rows={5} className="p-5" />
      ) : history.isError ? (
        <ErrorState error={history.error} onRetry={() => history.refetch()} retrying={history.isFetching} />
      ) : history.data.content.length === 0 ? (
        <EmptyState
          icon={<History className="h-5 w-5" />}
          title={hasFilters ? 'No interviews match these filters' : 'No interviews yet'}
          description={hasFilters ? 'Try a different status or type.' : 'Completed and upcoming sessions you join will appear here.'}
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={() => setSearchParams({})}>
                Clear filters
              </Button>
            ) : (
              <Link to={paths.newInterview} className={buttonClasses()}>
                Start an interview
              </Link>
            )
          }
        />
      ) : (
        <div className={history.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
          <InterviewHistoryList items={history.data.content} />
          <Pagination
            page={history.data.number}
            totalPages={history.data.totalPages}
            totalElements={history.data.totalElements}
            pageSize={history.data.size}
            isFetching={history.isFetching}
            onPageChange={(next) => updateParams({ page: next > 0 ? String(next) : undefined })}
          />
        </div>
      )}
    </Card>
  )
}
