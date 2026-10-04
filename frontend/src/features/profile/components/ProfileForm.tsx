import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Avatar } from '@/components/common/Avatar'
import { Button } from '@/components/common/Button'
import { Alert } from '@/components/feedback/Alert'
import { FormField } from '@/components/forms/FormField'
import { Select, Textarea, TextInput } from '@/components/forms/controls'
import { EXPERIENCE_LEVEL_LABELS, EXPERIENCE_LEVELS, INTERVIEW_ROLE_LABELS, INTERVIEW_ROLES } from '@/constants/enums'
import { profileSchema, type ProfileFormValues } from '@/features/profile/validation/profileSchema'
import type { ProfilePayload, UserProfile } from '@/features/profile/types'
import { getErrorMessage } from '@/lib/apiError'

interface ProfileFormProps {
  profile?: UserProfile | null
  avatarLabel: string
  submitLabel: string
  isSubmitting: boolean
  error: unknown
  onSubmit: (payload: ProfilePayload) => void
  onCancel?: () => void
}

function toFormValues(profile?: UserProfile | null): ProfileFormValues {
  return {
    experience_level: profile?.experience_level ?? '',
    preferred_role: profile?.preferred_role ?? '',
    bio: profile?.bio ?? '',
    image_url: profile?.image_url ?? '',
  }
}

export function ProfileForm({ profile, avatarLabel, submitLabel, isSubmitting, error, onSubmit, onCancel }: ProfileFormProps) {
  const isEditing = Boolean(profile)
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema), defaultValues: toFormValues(profile) })
  const imageUrl = useWatch({ control, name: 'image_url' })

  const submit = handleSubmit((values) =>
    onSubmit({
      // The backend ignores nulls on update, so an unset select keeps its stored value.
      experience_level: values.experience_level || null,
      preferred_role: values.preferred_role || null,
      // Empty strings are persisted, which is how text fields are cleared.
      bio: values.bio.trim(),
      image_url: values.image_url.trim(),
    }),
  )

  // Enum fields cannot be cleared once stored (PUT ignores null), so only offer "Not specified" when unset.
  const allowEmptyExperience = !isEditing || !profile?.experience_level
  const allowEmptyRole = !isEditing || !profile?.preferred_role

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      {error != null && <Alert tone="danger">{getErrorMessage(error)}</Alert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Experience level" error={errors.experience_level?.message}>
          {(field) => (
            <Select {...field} {...register('experience_level')}>
              {allowEmptyExperience && <option value="">Not specified</option>}
              {EXPERIENCE_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {EXPERIENCE_LEVEL_LABELS[level]}
                </option>
              ))}
            </Select>
          )}
        </FormField>

        <FormField label="Preferred interview role" error={errors.preferred_role?.message}>
          {(field) => (
            <Select {...field} {...register('preferred_role')}>
              {allowEmptyRole && <option value="">Not specified</option>}
              {INTERVIEW_ROLES.map((role) => (
                <option key={role} value={role}>
                  {INTERVIEW_ROLE_LABELS[role]}
                </option>
              ))}
            </Select>
          )}
        </FormField>
      </div>

      <FormField label="Bio" optional error={errors.bio?.message} hint="What are you preparing for? Share your focus areas.">
        {(field) => <Textarea {...field} rows={4} placeholder="Backend engineer preparing for system design rounds…" {...register('bio')} />}
      </FormField>

      <div className="flex items-start gap-4">
        <Avatar label={avatarLabel} src={errors.image_url ? null : imageUrl} size={44} className="mt-7" />
        <FormField label="Profile photo URL" optional className="flex-1" error={errors.image_url?.message}>
          {(field) => <TextInput {...field} type="url" inputMode="url" placeholder="https://…" {...register('image_url')} />}
        </FormField>
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-5">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        {isEditing && (
          <Button variant="secondary" onClick={() => reset(toFormValues(profile))} disabled={!isDirty || isSubmitting}>
            Reset
          </Button>
        )}
        <Button type="submit" loading={isSubmitting} disabled={isEditing && !isDirty}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
