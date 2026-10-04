import { Link, useParams } from 'react-router-dom'
import { Pencil, UserX } from 'lucide-react'
import { buttonClasses } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { Skeleton } from '@/components/common/Skeleton'
import { Alert } from '@/components/feedback/Alert'
import { EmptyState, ErrorState } from '@/components/feedback/states'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProfileHeader } from '@/features/profile/components/ProfileHeader'
import { ProfileStatsGrid } from '@/features/profile/components/ProfileStatsGrid'
import { useMyProfile, usePublicProfile } from '@/features/profile/hooks/useProfile'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { isApiErrorStatus } from '@/lib/apiError'
import { paths } from '@/routes/paths'

/** /u/:username — what any signed-in user sees: no reviews, no resume. */
export default function PublicProfilePage() {
  const { username = '' } = useParams()
  const profile = usePublicProfile(username)
  const me = useMyProfile()
  useDocumentTitle(profile.data ? `${profile.data.name} (@${profile.data.username})` : `@${username}`)

  if (profile.isPending) {
    return (
      <Card className="p-5">
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="mt-4 h-5 w-48" />
        <Skeleton className="mt-3 h-16 w-full" />
      </Card>
    )
  }
  if (profile.isError) {
    return isApiErrorStatus(profile.error, 404) ? (
      <Card>
        <EmptyState
          icon={<UserX className="h-5 w-5" />}
          title={`No one goes by @${username}`}
          description="Check the spelling of the username."
          action={
            <Link to={paths.home} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
              Go home
            </Link>
          }
        />
      </Card>
    ) : (
      <Card>
        <ErrorState error={profile.error} onRetry={() => profile.refetch()} retrying={profile.isFetching} />
      </Card>
    )
  }

  const data = profile.data
  const isMe = me.data?.user_id === data.user_id

  return (
    <>
      <PageHeader
        title={data.name}
        description={data.username ? `@${data.username}` : undefined}
        actions={
          isMe && (
            <Link to={paths.settings} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
              <Pencil className="h-3.5 w-3.5" /> Edit profile
            </Link>
          )
        }
      />
      {isMe && (
        <Alert tone="info" className="mb-6">
          This is how other people see your profile. Your reviews and resume stay private.
        </Alert>
      )}
      <div className="max-w-4xl space-y-6">
        <ProfileHeader profile={data} />
        <ProfileStatsGrid stats={data} />
      </div>
    </>
  )
}
