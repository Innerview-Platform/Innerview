import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { UserRoundPlus } from 'lucide-react'
import { buttonClasses } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { SkeletonRows } from '@/components/common/Skeleton'
import { EmptyState, ErrorState } from '@/components/feedback/states'
import { useMyProfile } from '@/features/profile/hooks/useProfile'
import { paths } from '@/routes/paths'

interface ProfileRequiredProps {
  /** What the profile unlocks, e.g. "your interview history". */
  feature: string
  children: ReactNode
}

/** The backend answers 404 for history, feedback and rating until the user has a profile. */
export function ProfileRequired({ feature, children }: ProfileRequiredProps) {
  const profile = useMyProfile()

  if (profile.isPending) {
    return (
      <Card className="p-5">
        <SkeletonRows rows={4} />
      </Card>
    )
  }
  if (profile.isError) {
    return (
      <Card>
        <ErrorState error={profile.error} onRetry={() => profile.refetch()} retrying={profile.isFetching} />
      </Card>
    )
  }
  if (!profile.data) {
    return (
      <Card>
        <EmptyState
          icon={<UserRoundPlus className="h-5 w-5" />}
          title="Create your profile first"
          description={`InnerView needs a profile before it can show ${feature}.`}
          action={
            <Link to={paths.profile} className={buttonClasses()}>
              Create profile
            </Link>
          }
        />
      </Card>
    )
  }
  return <>{children}</>
}
