import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Star } from 'lucide-react'
import { toast } from 'sonner'
import { Button, buttonClasses } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { StarRating } from '@/components/feedback/StarRating'
import { EmptyState, ErrorState, PageLoader } from '@/components/feedback/states'
import { Select, Textarea } from '@/components/forms/controls'
import { PageHeader } from '@/components/layout/PageHeader'
import { interviewsApi } from '@/features/interviews/api/interviewsApi'
import type { FeedbackForm, FeedbackView, HireSignal } from '@/features/interviews/types'
import { ROOM_ROLE_LABELS } from '@/features/room/utils/labels'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getErrorMessage } from '@/lib/apiError'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

const HIRE_SIGNALS: { value: HireSignal; label: string }[] = [
  { value: 'STRONG_YES', label: 'Strong yes' },
  { value: 'YES', label: 'Yes' },
  { value: 'LEAN_YES', label: 'Leaning yes' },
  { value: 'LEAN_NO', label: 'Leaning no' },
  { value: 'NO', label: 'No' },
  { value: 'STRONG_NO', label: 'Strong no' },
]

function ScorePicker({ value, onChange, label }: { value: number; onChange: (value: number) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1">
      {[1, 2, 3, 4, 5].map((score) => (
        <button
          key={score}
          type="button"
          role="radio"
          aria-checked={value === score}
          onClick={() => onChange(score)}
          className={cn(
            'h-8 w-8 rounded-md border text-[13px] font-medium transition-colors',
            value === score ? 'border-primary bg-primary text-white' : 'border-border text-fg-muted hover:border-fg-muted hover:text-fg',
          )}
        >
          {score}
        </button>
      ))}
    </div>
  )
}

function FeedbackSummary({ feedback, criteria }: { feedback: FeedbackView; criteria?: { id: string; label: string }[] }) {
  return (
    <div className="space-y-2 text-[13px]">
      <div className="flex items-center gap-2">
        <StarRating value={feedback.rating} size={14} />
        {feedback.hireSignal && <span className="rounded bg-elevated px-2 py-0.5 text-xs">{HIRE_SIGNALS.find((h) => h.value === feedback.hireSignal)?.label}</span>}
      </div>
      {feedback.scores && Object.keys(feedback.scores).length > 0 && (
        <ul className="grid gap-1 sm:grid-cols-2">
          {Object.entries(feedback.scores).map(([id, score]) => (
            <li key={id} className="flex justify-between gap-2 text-fg-secondary">
              <span>{criteria?.find((c) => c.id === id)?.label ?? id.replace(/_/g, ' ')}</span>
              <span className="font-mono">{score}/5</span>
            </li>
          ))}
        </ul>
      )}
      {feedback.comment && <p className="whitespace-pre-wrap text-fg-secondary">{feedback.comment}</p>}
    </div>
  )
}

function ReviewCard({ interviewId, reviewee }: { interviewId: string; reviewee: FeedbackForm['reviewees'][number] }) {
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(0)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [hireSignal, setHireSignal] = useState<HireSignal | ''>('')
  const [comment, setComment] = useState('')

  const submit = useMutation({
    mutationFn: () =>
      interviewsApi.submitFeedback(interviewId, { revieweeId: reviewee.userId, rating, scores, comment: comment.trim() || undefined, hireSignal: hireSignal || undefined }),
    onSuccess: () => {
      toast.success(`Feedback for ${reviewee.name} saved`)
      void queryClient.invalidateQueries({ queryKey: ['interviews', interviewId, 'feedback'] })
    },
    onError: (error) => toast.error("Couldn't save feedback", { description: getErrorMessage(error) }),
  })

  const complete = rating > 0 && reviewee.criteria.every((c) => scores[c.id])

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">
          {reviewee.name} <span className="text-sm font-normal text-fg-muted">· {ROOM_ROLE_LABELS[reviewee.role]}</span>
        </h2>
        {reviewee.submitted && (
          <span className="flex items-center gap-1 text-xs text-success">
            <CheckCircle2 className="h-4 w-4" /> Submitted
          </span>
        )}
      </div>

      {reviewee.submitted ? (
        <div className="mt-4">
          <FeedbackSummary feedback={reviewee.submitted} criteria={reviewee.criteria} />
        </div>
      ) : (
        <form
          className="mt-4 space-y-5"
          onSubmit={(event) => {
            event.preventDefault()
            if (complete) submit.mutate()
          }}
        >
          <ul className="space-y-4">
            {reviewee.criteria.map((criterion) => (
              <li key={criterion.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">{criterion.label}</p>
                  <p className="text-xs text-fg-muted">{criterion.description}</p>
                </div>
                <ScorePicker label={criterion.label} value={scores[criterion.id] ?? 0} onChange={(value) => setScores((s) => ({ ...s, [criterion.id]: value }))} />
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium">Overall</p>
            <div role="radiogroup" aria-label="Overall rating" className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} stars`} onClick={() => setRating(value)}>
                  <Star className={cn('h-6 w-6', value <= rating ? 'fill-warning text-warning' : 'text-fg-muted')} />
                </button>
              ))}
            </div>
          </div>

          {reviewee.hireSignal && (
            <label className="flex flex-col gap-2 text-sm font-medium sm:flex-row sm:items-center sm:justify-between">
              Would you hire them for this level?
              <Select className="sm:w-48" value={hireSignal} onChange={(e) => setHireSignal(e.target.value as HireSignal)}>
                <option value="">No recommendation</option>
                {HIRE_SIGNALS.map((signal) => (
                  <option key={signal.value} value={signal.value}>
                    {signal.label}
                  </option>
                ))}
              </Select>
            </label>
          )}

          <Textarea
            aria-label="Written feedback"
            placeholder={reviewee.role === 'INTERVIEWEE' ? 'What went well, and what should they work on next?' : 'How could they improve as an interviewer?'}
            value={comment}
            maxLength={4000}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex items-center justify-end gap-3">
            {!complete && <span className="text-xs text-fg-muted">Score every criterion and give an overall rating.</span>}
            <Button type="submit" disabled={!complete} loading={submit.isPending}>
              Submit feedback
            </Button>
          </div>
        </form>
      )}
    </Card>
  )
}

/** /interviews/:id/feedback — scorecards for the other participants, and the feedback you received. */
export default function InterviewFeedbackPage() {
  const { interviewId = '' } = useParams()
  useDocumentTitle('Interview feedback')
  const form = useQuery({ queryKey: ['interviews', interviewId, 'feedback'], queryFn: () => interviewsApi.getFeedbackForm(interviewId) })

  if (form.isPending) return <PageLoader />
  if (!form.data) return <ErrorState error={form.error} onRetry={() => form.refetch()} retrying={form.isFetching} />

  const f = form.data
  const pending = f.reviewees.filter((r) => !r.submitted).length

  return (
    <>
      <PageHeader
        title="Interview feedback"
        description={pending ? `Give feedback to ${pending} participant${pending > 1 ? 's' : ''} — it's what makes mock interviews useful.` : 'Thanks — your feedback is in.'}
        actions={
          <Link to={paths.interview(f.interviewId)} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
            Interview summary
          </Link>
        }
      />
      <div className="mx-auto max-w-3xl space-y-4">
        {f.status !== 'COMPLETED' && <Card className="p-5 text-sm text-fg-muted">Feedback opens once the interview has ended.</Card>}
        {f.status === 'COMPLETED' && f.reviewees.length === 0 && (
          <EmptyState icon={<Star className="h-5 w-5" />} title="Nobody to review" description="There were no other participants you can give feedback to." />
        )}
        {f.status === 'COMPLETED' && f.reviewees.map((reviewee) => <ReviewCard key={reviewee.userId} interviewId={interviewId} reviewee={reviewee} />)}

        {f.received.length > 0 && (
          <div className="space-y-3 pt-4">
            <h2 className="text-sm font-semibold">Feedback you received</h2>
            {f.received.map((feedback) => (
              <Card key={feedback.id} className="p-5">
                <p className="mb-3 text-sm font-medium">
                  {feedback.reviewerName} <span className="font-normal text-fg-muted">· {feedback.reviewerRole ? ROOM_ROLE_LABELS[feedback.reviewerRole] : ''}</span>
                </p>
                <FeedbackSummary feedback={feedback} />
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
