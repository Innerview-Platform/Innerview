import { Link } from 'react-router-dom'
import { ArrowRight, CalendarPlus, Code2, History, Star, TrendingUp, Zap } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import { buttonClasses } from '@/components/common/Button'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { SkeletonRows } from '@/components/common/Skeleton'
import { Alert } from '@/components/feedback/Alert'
import { EmptyState, ErrorState } from '@/components/feedback/states'
import { PageHeader } from '@/components/layout/PageHeader'
import { selectCurrentUser } from '@/features/auth/slices/authSlice'
import { StatCard } from '@/features/dashboard/components/StatCard'
import { FeedbackList } from '@/features/feedback/components/FeedbackList'
import { useFeedback } from '@/features/feedback/hooks/useFeedback'
import { InterviewHistoryList } from '@/features/interviews/components/InterviewHistoryList'
import { useInterviewHistory } from '@/features/interviews/hooks/useInterviews'
import { useMyLanguages } from '@/features/languages/hooks/useLanguages'
import { useMyProfile, useUserRating } from '@/features/profile/hooks/useProfile'
import { JoinRoomForm } from '@/features/room/components/JoinRoomForm'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { paths } from '@/routes/paths'

export default function DashboardPage() {
  useDocumentTitle('Dashboard')
  const user = useAppSelector(selectCurrentUser)!
  const profile = useMyProfile()
  const hasProfile = Boolean(profile.data)

  // Profile-scoped endpoints 404 without a profile, so they only run once one exists.
  const rating = useUserRating(user.id, hasProfile)
  const history = useInterviewHistory(user.id, { page: 0, limit: 5 }, { enabled: hasProfile })
  const feedback = useFeedback(user.id, 'received', { page: 0, limit: 3 }, hasProfile)
  const languages = useMyLanguages()

  const profileLoading = profile.isPending
  const noProfile = !profileLoading && !profile.isError && !hasProfile

  return (
    <>
      <PageHeader
        title="Welcome back"
        description={user.email}
        actions={
          <Link to={paths.newInterview} className={buttonClasses()}>
            <CalendarPlus className="h-4 w-4" /> New interview
          </Link>
        }
      />

      {noProfile && (
        <Alert
          tone="info"
          className="mb-6"
          title="Complete your profile"
          action={
            <Link to={paths.profile} className={buttonClasses({ size: 'sm' })}>
              Create profile
            </Link>
          }
        >
          Add your experience level and preferred role to unlock interview history, feedback and ratings.
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Average rating"
          icon={Star}
          loading={profileLoading || (hasProfile && rating.isPending)}
          value={rating.data?.total_reviews ? rating.data.average_rating.toFixed(1) : '—'}
          hint={hasProfile ? 'Across all reviews' : 'Requires a profile'}
        />
        <StatCard
          label="Reviews received"
          icon={TrendingUp}
          loading={profileLoading || (hasProfile && rating.isPending)}
          value={rating.data?.total_reviews ?? '—'}
          hint={hasProfile ? 'From interview partners' : 'Requires a profile'}
        />
        <StatCard
          label="Interviews"
          icon={History}
          loading={profileLoading || (hasProfile && history.isPending)}
          value={history.data?.totalElements ?? '—'}
          hint={hasProfile ? 'All-time sessions' : 'Requires a profile'}
        />
        <StatCard
          label="Languages"
          icon={Code2}
          loading={languages.isPending}
          value={languages.data?.length ?? '—'}
          hint={
            <Link to={paths.profile} className="hover:text-fg-secondary hover:underline">
              Manage languages
            </Link>
          }
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader title="Quick start" description="Jump into a session." />
          <CardBody className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
            <Link
              to={paths.newInterview}
              className="group flex items-center gap-3 rounded-xl border border-border p-4 transition-colors hover:border-primary/60 hover:bg-primary/5"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary-hover">
                <Zap className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium">Start or schedule</span>
                <span className="block text-[13px] text-fg-muted">Create a room and invite a peer</span>
              </span>
              <ArrowRight className="h-4 w-4 text-fg-muted transition-transform group-hover:translate-x-0.5" />
            </Link>
            <JoinRoomForm />
          </CardBody>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader
            title="Recent interviews"
            action={
              hasProfile && (
                <Link to={paths.interviews} className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
                  View all
                </Link>
              )
            }
          />
          {profileLoading || (hasProfile && history.isPending) ? (
            <SkeletonRows rows={3} className="p-5" />
          ) : !hasProfile ? (
            <EmptyState icon={<History className="h-5 w-5" />} title="No history yet" description="Create a profile to track your sessions." />
          ) : history.isError ? (
            <ErrorState error={history.error} onRetry={() => history.refetch()} />
          ) : history.data!.content.length === 0 ? (
            <EmptyState icon={<History className="h-5 w-5" />} title="No interviews yet" description="Sessions you join will appear here." />
          ) : (
            <InterviewHistoryList items={history.data!.content} />
          )}
        </Card>
      </div>

      {hasProfile && (
        <Card className="mt-6">
          <CardHeader
            title="Latest feedback"
            action={
              <Link to={paths.feedback} className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
                View all
              </Link>
            }
          />
          {feedback.isPending ? (
            <SkeletonRows rows={2} className="p-5" />
          ) : feedback.isError ? (
            <ErrorState error={feedback.error} onRetry={() => feedback.refetch()} />
          ) : feedback.data.content.length === 0 ? (
            <EmptyState icon={<Star className="h-5 w-5" />} title="No feedback yet" description="Ratings from your interview partners will show up here." />
          ) : (
            <FeedbackList items={feedback.data.content} direction="received" />
          )}
        </Card>
      )}
    </>
  )
}
