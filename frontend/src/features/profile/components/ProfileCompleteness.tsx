import { CheckCircle2, Circle } from 'lucide-react'
import { Card } from '@/components/common/Card'
import { useMyLanguages } from '@/features/languages/hooks/useLanguages'
import type { UserProfile } from '@/features/profile/types'
import { cn } from '@/lib/utils'

/** Where each missing item is fixed: the edit form, or a card further down the page. */
export type CompletenessTarget = 'form' | 'photo' | 'resume' | 'languages'

interface Item {
  label: string
  done: boolean
  target: CompletenessTarget
}

function completenessItems(profile: UserProfile, languageCount: number): Item[] {
  return [
    { label: 'Username, employment and education', done: profile.profile_complete, target: 'form' },
    { label: 'Profile photo', done: Boolean(profile.avatar_url), target: 'photo' },
    { label: 'Headline', done: Boolean(profile.headline), target: 'form' },
    { label: 'Bio', done: Boolean(profile.bio), target: 'form' },
    { label: 'Resume', done: Boolean(profile.resume), target: 'resume' },
    { label: 'Experience level', done: Boolean(profile.experience_level), target: 'form' },
    { label: 'Preferred interview role', done: Boolean(profile.preferred_role), target: 'form' },
    { label: 'Location and time zone', done: Boolean(profile.location && profile.timezone), target: 'form' },
    { label: 'A LinkedIn, GitHub or portfolio link', done: Boolean(profile.linkedin_url || profile.github_url || profile.portfolio_url), target: 'form' },
    { label: 'Programming languages', done: languageCount > 0, target: 'languages' },
  ]
}

/** "70% complete" with what's missing; hidden once everything is filled in. */
export function ProfileCompleteness({ profile, onFix }: { profile: UserProfile; onFix: (target: CompletenessTarget) => void }) {
  const languages = useMyLanguages()
  if (languages.isPending) return null
  const items = completenessItems(profile, languages.data?.length ?? 0)
  const done = items.filter((item) => item.done).length
  const percent = Math.round((done / items.length) * 100)
  if (percent === 100) return null
  const missing = items.filter((item) => !item.done)

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">Profile {percent}% complete</h2>
        <span className="text-xs text-fg-muted">
          {done} of {items.length}
        </span>
      </div>
      <div
        className="mt-2.5 h-2 overflow-hidden rounded-full bg-elevated"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Profile completeness"
      >
        <div className={cn('h-full rounded-full transition-[width]', percent < 50 ? 'bg-warning' : 'bg-primary')} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-3 text-xs text-fg-muted">Complete profiles help interview partners know who they're meeting. Still missing:</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {missing.map((item) => (
          <li key={item.label}>
            <button
              type="button"
              onClick={() => onFix(item.target)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-fg-secondary transition-colors hover:border-fg-muted hover:text-fg"
            >
              <Circle className="h-3 w-3" aria-hidden /> {item.label}
            </button>
          </li>
        ))}
      </ul>
      {done > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-success">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> {done} done
        </p>
      )}
    </Card>
  )
}
