import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Lock, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Button, buttonClasses } from '@/components/common/Button'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { Skeleton } from '@/components/common/Skeleton'
import { ErrorState } from '@/components/feedback/states'
import { PageHeader } from '@/components/layout/PageHeader'
import { RecentReviewsCard } from '@/features/feedback/components/RecentReviewsCard'
import { LanguagesManager } from '@/features/languages/components/LanguagesManager'
import { AvatarEditor } from '@/features/profile/components/AvatarEditor'
import { DeleteAccountCard } from '@/features/profile/components/DeleteAccountCard'
import { ProfileCompleteness, type CompletenessTarget } from '@/features/profile/components/ProfileCompleteness'
import { ProfileForm } from '@/features/profile/components/ProfileForm'
import { ProfileHeader } from '@/features/profile/components/ProfileHeader'
import { ProfileStatsGrid } from '@/features/profile/components/ProfileStatsGrid'
import { ResumeCard } from '@/features/profile/components/ResumeCard'
import { useMyProfile, useUpdateProfile } from '@/features/profile/hooks/useProfile'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { paths } from '@/routes/paths'

export default function ProfilePage() {
  useDocumentTitle('Profile')
  const profileQuery = useMyProfile()
  const updateProfile = useUpdateProfile()
  const [editing, setEditing] = useState(false)

  if (profileQuery.isPending) {
    return (
      <>
        <PageHeader title="Profile" />
        <Card className="p-5">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="mt-4 h-5 w-48" />
          <Skeleton className="mt-3 h-16 w-full" />
        </Card>
      </>
    )
  }
  if (profileQuery.isError) {
    return (
      <>
        <PageHeader title="Profile" />
        <Card>
          <ErrorState error={profileQuery.error} onRetry={() => profileQuery.refetch()} retrying={profileQuery.isFetching} />
        </Card>
      </>
    )
  }

  const profile = profileQuery.data
  // Older and Google accounts start incomplete: go straight to the form.
  const completing = !profile.profile_complete

  const fix = (target: CompletenessTarget) => {
    if (target === 'form') {
      setEditing(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const element = document.getElementById(`profile-${target}`)
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (target === 'photo') element?.querySelector<HTMLButtonElement>('button')?.focus()
  }

  return (
    <>
      <PageHeader
        title="Profile"
        description="How other engineers see you on InnerView."
        actions={
          profile.username && (
            <Link to={paths.publicProfile(profile.username)} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
              <ExternalLink className="h-3.5 w-3.5" /> View public profile
            </Link>
          )
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          {!completing && <ProfileCompleteness profile={profile} onFix={fix} />}
          {editing || completing ? (
            <Card>
              <CardHeader
                title={completing ? 'Complete your profile' : 'Edit profile'}
                description={
                  completing
                    ? 'Pick a username and add your employment, university and college so others know who they are interviewing with.'
                    : undefined
                }
              />
              <CardBody className="py-5">
                <ProfileForm
                  profile={profile}
                  submitLabel={completing ? 'Save profile' : 'Save changes'}
                  isSubmitting={updateProfile.isPending}
                  error={updateProfile.error}
                  onCancel={
                    completing
                      ? undefined
                      : () => {
                          updateProfile.reset()
                          setEditing(false)
                        }
                  }
                  onSubmit={(payload) =>
                    updateProfile.mutate(payload, {
                      onSuccess: () => {
                        toast.success(completing ? 'Profile completed' : 'Profile updated')
                        setEditing(false)
                      },
                    })
                  }
                />
              </CardBody>
            </Card>
          ) : (
            <ProfileHeader
              profile={profile}
              avatar={
                <div id="profile-photo">
                  <AvatarEditor name={profile.name} avatarUrl={profile.avatar_url} />
                </div>
              }
              emailNote={profile.show_email ? 'visible to others' : 'only you can see it'}
              actions={
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)} leftIcon={<Pencil className="h-3.5 w-3.5" />}>
                  Edit profile
                </Button>
              }
            />
          )}

          <ProfileStatsGrid stats={profile} />
          <div id="profile-resume">
            <ResumeCard resume={profile.resume} />
          </div>
          <RecentReviewsCard
            title="Reviews about you"
            description={
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden /> Private — only you can see this section.
              </span>
            }
            limit={4}
            gridClassName="p-3 sm:p-5 xl:grid-cols-2"
          />
        </div>
        <div className="min-w-0 space-y-6">
          <div id="profile-languages">
            <LanguagesManager />
          </div>
          <DeleteAccountCard profile={profile} />
        </div>
      </div>
    </>
  )
}
