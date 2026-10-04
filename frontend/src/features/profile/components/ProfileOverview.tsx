import { Pencil } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { Skeleton } from '@/components/common/Skeleton'
import { StarRating } from '@/components/feedback/StarRating'
import { EXPERIENCE_LEVEL_LABELS, INTERVIEW_ROLE_LABELS, labelFor } from '@/constants/enums'
import { useUserRating } from '@/features/profile/hooks/useProfile'
import type { UserProfile } from '@/features/profile/types'
import { formatDate } from '@/lib/utils'

interface ProfileOverviewProps {
  profile: UserProfile
  email: string
  onEdit: () => void
}

export function ProfileOverview({ profile, email, onEdit }: ProfileOverviewProps) {
  const rating = useUserRating(profile.user_id)

  return (
    <Card className="overflow-hidden">
      <div className="h-20 bg-gradient-to-r from-primary/30 via-accent/20 to-transparent" aria-hidden />
      <div className="px-5 pb-5">
        <div className="-mt-9 flex items-end justify-between gap-3">
          <Avatar label={email} src={profile.image_url} size={72} className="ring-4 ring-surface" />
          <Button variant="secondary" size="sm" onClick={onEdit} leftIcon={<Pencil className="h-3.5 w-3.5" />}>
            Edit profile
          </Button>
        </div>

        <h2 className="mt-3 truncate text-lg font-semibold">{email}</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {profile.experience_level && <Badge tone="primary">{labelFor(EXPERIENCE_LEVEL_LABELS, profile.experience_level)}</Badge>}
          {profile.preferred_role && <Badge>Prefers: {labelFor(INTERVIEW_ROLE_LABELS, profile.preferred_role)}</Badge>}
        </div>

        <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-fg-secondary">
          {profile.bio || <span className="text-fg-muted italic">No bio yet.</span>}
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
          <div>
            <dt className="text-xs text-fg-muted">Average rating</dt>
            <dd className="mt-1">
              {rating.isPending ? (
                <Skeleton className="h-5 w-24" />
              ) : rating.data ? (
                <span className="flex items-center gap-2">
                  <StarRating value={rating.data.average_rating} />
                  <span className="text-fg-secondary">
                    {rating.data.total_reviews ? rating.data.average_rating.toFixed(1) : 'No reviews'}
                  </span>
                </span>
              ) : (
                <span className="text-fg-muted">Unavailable</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-fg-muted">Member since</dt>
            <dd className="mt-1 text-fg-secondary">{formatDate(profile.created_at)}</dd>
          </div>
        </dl>
      </div>
    </Card>
  )
}
