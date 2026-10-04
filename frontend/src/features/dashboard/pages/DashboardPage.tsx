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
import { RecentReviewsCard } from '@/features/feedback/components/RecentReviewsCard'
import { InterviewHistoryList } from '@/features/interviews/components/InterviewHistoryList'
import { UpcomingInterviews } from '@/features/interviews/components/UpcomingInterviews'
import { useInterviewHistory } from '@/features/interviews/hooks/useInterviews'
import { useMyLanguages } from '@/features/languages/hooks/useLanguages'
import { useMyProfile, useUserRating } from '@/features/profile/hooks/useProfile'
import { JoinRoomForm } from '@/features/room/components/JoinRoomForm'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { paths } from '@/routes/paths'

export default function DashboardPage() {
  useDocumentTitle('Home')
  const user = useAppSelector(selectCurrentUser)!
  const profile = useMyProfile()

  const rating = useUserRating(user.id)
  const history = useInterviewHistory(user.id, { page: 0, limit: 5 }, { enabled: true })
  const languages = useMyLanguages()

  const profileIncomplete = profile.data ? !profile.data.profile_complete : false

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

      {profileIncomplete && (
        <Alert
          tone="info"
          className="mb-6"
          title="Complete your profile"
          action={
            <Link to={paths.settings} className={buttonClasses({ size: 'sm' })}>
              Complete profile
            </Link>
          }
        >
          Pick a username and add your employment, university and college so interview partners know who they're meeting.
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Average rating"
          icon={Star}
          loading={rating.isPending}
          value={rating.data?.total_reviews ? rating.data.average_rating.toFixed(1) : '—'}
          hint="Across all reviews"
        />
        <StatCard
          label="Reviews received"
          icon={TrendingUp}
          loading={rating.isPending}
          value={rating.data?.total_reviews ?? '—'}
          hint="From interview partners"
        />
        <StatCard
          label="Interviews"
          icon={History}
          loading={history.isPending}
          value={history.data?.totalElements ?? '—'}
          hint="All-time sessions"
        />
        <StatCard
          label="Languages"
          icon={Code2}
          loading={languages.isPending}
          value={languages.data?.length ?? '—'}
          hint={
            <Link to={paths.settings} className="hover:text-fg-secondary hover:underline">
              Manage languages
            </Link>
          }
        />
      </div>

      <Card className="mt-6">
        <CardHeader title="Upcoming" description="Interviews you host or are invited to." />
        <CardBody className="py-0">
          <UpcomingInterviews limit={5} />
        </CardBody>
      </Card>

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
              <Link to={paths.interviews} className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
                View all
              </Link>
            }
          />
          {history.isPending ? (
            <SkeletonRows rows={3} className="p-5" />
          ) : history.isError ? (
            <ErrorState error={history.error} onRetry={() => history.refetch()} />
          ) : history.data!.content.length === 0 ? (
            <EmptyState icon={<History className="h-5 w-5" />} title="No interviews yet" description="Sessions you join will appear here." />
          ) : (
            <InterviewHistoryList items={history.data!.content} />
          )}
        </Card>
      </div>

      <div className="mt-6">
        <RecentReviewsCard title="Latest reviews" />
      </div>
    </>
  )
}
