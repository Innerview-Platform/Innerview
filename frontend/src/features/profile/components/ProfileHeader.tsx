import type { ReactNode } from 'react'
import { Briefcase, Clock, Globe, GraduationCap, Link2, Mail, MapPin } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { Badge } from '@/components/common/Badge'
import { Card } from '@/components/common/Card'
import { EMPLOYMENT_STATUS_LABELS, EXPERIENCE_LEVEL_LABELS, INTERVIEW_ROLE_LABELS, labelFor } from '@/constants/enums'
import type { ProfileFields } from '@/features/profile/types'
import { formatDate } from '@/lib/utils'

interface ProfileHeaderProps {
  profile: ProfileFields & { email: string | null }
  /** Replaces the plain avatar, e.g. with the photo editor on your own profile. */
  avatar?: ReactNode
  actions?: ReactNode
  /** Small note under the email, e.g. whether it is visible to others. */
  emailNote?: ReactNode
}

/** Name, photo, work, education, links and bio — the same layout on your own and public profiles. */
export function ProfileHeader({ profile, avatar, actions, emailNote }: ProfileHeaderProps) {
  const work =
    profile.employment_status === 'EMPLOYED' ? profile.company : labelFor(EMPLOYMENT_STATUS_LABELS, profile.employment_status)
  const education = [profile.college, profile.university].filter(Boolean).join(', ')
  const links = [
    { label: 'LinkedIn', href: profile.linkedin_url, icon: Link2 },
    { label: 'GitHub', href: profile.github_url, icon: Link2 },
    { label: 'Portfolio', href: profile.portfolio_url, icon: Globe },
  ].filter((link): link is typeof link & { href: string } => Boolean(link.href))

  return (
    <Card className="overflow-hidden">
      <div
        className="h-20 border-b border-border-subtle bg-elevated sm:h-24"
        style={{ backgroundImage: 'radial-gradient(var(--color-border) 1px, transparent 1px)', backgroundSize: '14px 14px' }}
        aria-hidden
      />
      <div className="px-4 pb-5 sm:px-6">
        <div className="-mt-10 flex flex-wrap items-end justify-between gap-3">
          {avatar ?? <Avatar label={profile.name} src={profile.avatar_url} size={88} className="ring-4 ring-surface" />}
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>

        <h2 className="mt-3 text-xl font-semibold break-words">{profile.name}</h2>
        {profile.username && <p className="text-sm text-fg-muted">@{profile.username}</p>}
        {profile.headline && <p className="mt-1 text-[15px] text-fg-secondary">{profile.headline}</p>}

        <ul className="mt-3 flex flex-col gap-1.5 text-sm text-fg-secondary sm:flex-row sm:flex-wrap sm:gap-x-5">
          {work && work !== '—' && (
            <li className="flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden /> {work}
            </li>
          )}
          {education && (
            <li className="flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden /> {education}
            </li>
          )}
          {profile.location && (
            <li className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden /> {profile.location}
            </li>
          )}
          {profile.timezone && (
            <li className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden /> {profile.timezone.replaceAll('_', ' ')}
            </li>
          )}
          {profile.email && (
            <li className="flex min-w-0 items-center gap-1.5">
              <Mail className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden />
              <a href={`mailto:${profile.email}`} className="truncate hover:text-fg hover:underline">
                {profile.email}
              </a>
              {emailNote && <span className="text-xs text-fg-muted">· {emailNote}</span>}
            </li>
          )}
        </ul>

        {(profile.experience_level || profile.preferred_role) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.experience_level && <Badge tone="primary">{labelFor(EXPERIENCE_LEVEL_LABELS, profile.experience_level)}</Badge>}
            {profile.preferred_role && <Badge>Prefers: {labelFor(INTERVIEW_ROLE_LABELS, profile.preferred_role)}</Badge>}
          </div>
        )}

        {links.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {links.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[13px] text-fg-secondary transition-colors hover:border-fg-muted hover:text-fg"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
              </a>
            ))}
          </div>
        )}

        <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-fg-secondary">
          {profile.bio || <span className="text-fg-muted italic">No bio yet.</span>}
        </p>
        <p className="mt-4 text-xs text-fg-muted">Member since {formatDate(profile.member_since)}</p>
      </div>
    </Card>
  )
}
