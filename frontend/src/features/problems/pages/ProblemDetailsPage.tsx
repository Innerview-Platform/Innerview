import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Archive, ArrowLeft, FileQuestion, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { useAppSelector } from '@/app/hooks'
import { Button, buttonClasses } from '@/components/common/Button'
import { Card, CardBody } from '@/components/common/Card'
import { Skeleton } from '@/components/common/Skeleton'
import { EmptyState, ErrorState } from '@/components/feedback/states'
import { ConfirmDialog } from '@/components/modals/ConfirmDialog'
import { selectCurrentUser } from '@/features/auth/slices/authSlice'
import { ProblemFormModal } from '@/features/problems/components/ProblemFormModal'
import { DifficultyBadge, ProblemLimits, TagChip } from '@/features/problems/components/ProblemRow'
import { TestCasesSection } from '@/features/problems/components/TestCasesSection'
import { useProblem, useProblemList, useProblemMutations } from '@/features/problems/hooks/useProblems'
import type { OwnedProblem } from '@/features/problems/types'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getErrorMessage, toApiError } from '@/lib/apiError'
import { formatDate } from '@/lib/utils'
import { paths } from '@/routes/paths'

/** /problems/:slug — the statement and examples; owners also edit, archive and manage test cases. */
export default function ProblemDetailsPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const user = useAppSelector(selectCurrentUser)
  const problem = useProblem(slug)
  const p = problem.data
  useDocumentTitle(p?.title ?? 'Problem')
  const owner = Boolean(p && user && p.createdBy?.id === user.id)

  // The by-slug view never includes the solution, so owners' edit form uses the "mine" copy.
  const mine = useProblemList('mine', { search: p?.title }, 0, 20, owner)
  const owned = mine.data?.content.find((candidate) => candidate.id === p?.id) as OwnedProblem | undefined

  const { archive } = useProblemMutations()
  const [editing, setEditing] = useState(false)
  const [archiving, setArchiving] = useState(false)

  if (problem.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }
  if (problem.isError || !p) {
    return toApiError(problem.error).status === 404 ? (
      <EmptyState
        icon={<FileQuestion className="h-5 w-5" />}
        title="Problem not found"
        description="It may have been renamed — titles change the link."
        action={
          <Link to={paths.problems} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
            Back to problems
          </Link>
        }
      />
    ) : (
      <ErrorState error={problem.error} title="Couldn't load the problem" onRetry={() => problem.refetch()} retrying={problem.isFetching} />
    )
  }

  return (
    <>
      <Link to={paths.problems} className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-fg-muted hover:text-fg">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Problems
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">{p.title}</h1>
            <DifficultyBadge difficulty={p.difficulty} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-fg-muted">
            {p.tags?.length > 0 && (
              <span className="flex flex-wrap gap-1">
                {p.tags.map((tag) => (
                  <Link key={tag} to={`${paths.problems}?tag=${encodeURIComponent(tag)}`}>
                    <TagChip tag={tag} />
                  </Link>
                ))}
              </span>
            )}
            <ProblemLimits problem={p} />
            <span>
              {owner ? 'You wrote this' : `by ${p.createdBy?.name ?? 'unknown'}`} · {formatDate(p.createdAt)}
            </span>
          </div>
        </div>
        {owner && (
          <div className="flex shrink-0 gap-2">
            <Button variant="secondary" leftIcon={<Pencil className="h-4 w-4" />} onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button variant="danger" leftIcon={<Archive className="h-4 w-4" />} onClick={() => setArchiving(true)}>
              Archive
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <Card>
          <CardBody className="py-5">
            <h2 className="mb-3 text-[13px] font-semibold tracking-wide text-fg-muted uppercase">Statement</h2>
            <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words text-fg">{p.statement || <span className="text-fg-muted italic">No statement.</span>}</div>
          </CardBody>
        </Card>
        <TestCasesSection problemId={p.id} owner={owner} />
      </div>

      <ProblemFormModal
        open={editing}
        problem={owned ?? p}
        onClose={() => setEditing(false)}
        // A new title gives the problem a new link.
        onSaved={(saved) => saved.slug !== p.slug && navigate(paths.problem(saved.slug), { replace: true })}
      />
      <ConfirmDialog
        open={archiving}
        title="Archive this problem?"
        description="It leaves the library and can't be attached to new interviews. You can restore it from Problems → Archived."
        confirmLabel="Archive"
        loading={archive.isPending}
        onCancel={() => setArchiving(false)}
        onConfirm={() =>
          archive.mutate(p.id, {
            onSuccess: () => {
              toast.success('Problem archived')
              navigate(`${paths.problems}?tab=archived`)
            },
            onError: (error) => toast.error("Couldn't archive the problem", { description: getErrorMessage(error) }),
            onSettled: () => setArchiving(false),
          })
        }
      />
    </>
  )
}
