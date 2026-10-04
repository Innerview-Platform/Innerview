import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAppSelector } from '@/app/hooks'
import { Button } from '@/components/common/Button'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { Skeleton } from '@/components/common/Skeleton'
import { ErrorState } from '@/components/feedback/states'
import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmDialog } from '@/components/modals/ConfirmDialog'
import { selectCurrentUser } from '@/features/auth/slices/authSlice'
import { LanguagesManager } from '@/features/languages/components/LanguagesManager'
import { ProfileForm } from '@/features/profile/components/ProfileForm'
import { ProfileOverview } from '@/features/profile/components/ProfileOverview'
import { useCreateProfile, useDeleteProfile, useMyProfile, useUpdateProfile } from '@/features/profile/hooks/useProfile'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getErrorMessage } from '@/lib/apiError'

export default function ProfilePage() {
  useDocumentTitle('Profile')
  const user = useAppSelector(selectCurrentUser)!
  const profileQuery = useMyProfile()
  const createProfile = useCreateProfile()
  const updateProfile = useUpdateProfile()
  const deleteProfile = useDeleteProfile()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const profile = profileQuery.data

  const content = (() => {
    if (profileQuery.isPending) {
      return (
        <Card className="p-5">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="mt-4 h-5 w-48" />
          <Skeleton className="mt-3 h-16 w-full" />
        </Card>
      )
    }
    if (profileQuery.isError) {
      return (
        <Card>
          <ErrorState error={profileQuery.error} onRetry={() => profileQuery.refetch()} retrying={profileQuery.isFetching} />
        </Card>
      )
    }
    if (!profile) {
      return (
        <Card>
          <CardHeader
            title="Create your profile"
            description="A profile unlocks your interview history, feedback and ratings."
          />
          <CardBody className="py-5">
            <ProfileForm
              avatarLabel={user.email}
              submitLabel="Create profile"
              isSubmitting={createProfile.isPending}
              error={createProfile.error}
              onSubmit={(payload) =>
                createProfile.mutate(payload, { onSuccess: () => toast.success('Profile created') })
              }
            />
          </CardBody>
        </Card>
      )
    }
    if (editing) {
      return (
        <Card>
          <CardHeader title="Edit profile" />
          <CardBody className="py-5">
            <ProfileForm
              profile={profile}
              avatarLabel={user.email}
              submitLabel="Save changes"
              isSubmitting={updateProfile.isPending}
              error={updateProfile.error}
              onCancel={() => {
                updateProfile.reset()
                setEditing(false)
              }}
              onSubmit={(payload) =>
                updateProfile.mutate(payload, {
                  onSuccess: () => {
                    toast.success('Profile updated')
                    setEditing(false)
                  },
                })
              }
            />
          </CardBody>
        </Card>
      )
    }
    return <ProfileOverview profile={profile} email={user.email} onEdit={() => setEditing(true)} />
  })()

  return (
    <>
      <PageHeader title="Profile" description="How other engineers see you on InnerView." />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {content}

          {profile && !editing && (
            <Card className="border-danger/25">
              <CardHeader title="Delete profile" description="Removes your bio, preferences and photo. Your account stays active." />
              <CardBody className="flex justify-end">
                <Button variant="danger" onClick={() => setConfirmDelete(true)} leftIcon={<Trash2 className="h-4 w-4" />}>
                  Delete profile
                </Button>
              </CardBody>
            </Card>
          )}
        </div>
        <div>
          <LanguagesManager />
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete your profile?"
        description="Your profile details will be permanently removed. Interview history, feedback and ratings will be unavailable until you create a new profile."
        confirmLabel="Delete profile"
        loading={deleteProfile.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() =>
          deleteProfile.mutate(undefined, {
            onSuccess: () => {
              setConfirmDelete(false)
              toast.success('Profile deleted')
            },
            onError: (error) => toast.error("Couldn't delete profile", { description: getErrorMessage(error) }),
          })
        }
      />
    </>
  )
}
