import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/common/Button'
import { Alert } from '@/components/feedback/Alert'
import { FormField } from '@/components/forms/FormField'
import { Select, Textarea, TextInput } from '@/components/forms/controls'
import {
  EMPLOYMENT_STATUS_LABELS,
  EMPLOYMENT_STATUSES,
  EXPERIENCE_LEVEL_LABELS,
  EXPERIENCE_LEVELS,
  INTERVIEW_ROLE_LABELS,
  INTERVIEW_ROLES,
} from '@/constants/enums'
import { UsernameField } from '@/features/profile/components/UsernameField'
import { useUsernameAvailability } from '@/features/profile/hooks/useUsernameAvailability'
import { profileSchema, type ProfileFormValues } from '@/features/profile/validation/profileSchema'
import type { ProfilePayload, UserProfile } from '@/features/profile/types'
import { getErrorMessage } from '@/lib/apiError'

interface ProfileFormProps {
  profile: UserProfile
  submitLabel: string
  isSubmitting: boolean
  error: unknown
  onSubmit: (payload: ProfilePayload) => void
  onCancel?: () => void
}

const TIME_ZONES: string[] = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : []

function toFormValues(profile: UserProfile): ProfileFormValues {
  return {
    username: profile.username ?? '',
    name: profile.name ?? '',
    // The select starts empty for accounts that have never set it; validation then asks for it.
    employment_status: (profile.employment_status ?? '') as ProfileFormValues['employment_status'],
    company: profile.company ?? '',
    university: profile.university ?? '',
    college: profile.college ?? '',
    headline: profile.headline ?? '',
    experience_level: profile.experience_level ?? '',
    preferred_role: profile.preferred_role ?? '',
    bio: profile.bio ?? '',
    location: profile.location ?? '',
    timezone: profile.timezone ?? '',
    linkedin_url: profile.linkedin_url ?? '',
    github_url: profile.github_url ?? '',
    portfolio_url: profile.portfolio_url ?? '',
    show_email: profile.show_email,
  }
}

export function ProfileForm({ profile, submitLabel, isSubmitting, error, onSubmit, onCancel }: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema), defaultValues: toFormValues(profile) })
  const employmentStatus = useWatch({ control, name: 'employment_status' })
  const usernameStatus = useUsernameAvailability(useWatch({ control, name: 'username' }), profile.username)

  const submit = handleSubmit((values) => {
    if (usernameStatus.state === 'taken') {
      setError('username', { message: usernameStatus.message }, { shouldFocus: true })
      return
    }
    onSubmit({
      ...values,
      company: values.employment_status === 'EMPLOYED' ? values.company : '',
      // The backend ignores nulls, so an unset select keeps its stored value.
      experience_level: values.experience_level || null,
      preferred_role: values.preferred_role || null,
    })
  })

  // Enum fields cannot be cleared once stored (PUT ignores null), so only offer "Not specified" when unset.
  const allowEmptyExperience = !profile.experience_level
  const allowEmptyRole = !profile.preferred_role

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      {error != null && <Alert tone="danger">{getErrorMessage(error)}</Alert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <UsernameField registration={register('username')} status={usernameStatus} error={errors.username?.message} />
        <FormField label="Full name" error={errors.name?.message}>
          {(field) => <TextInput {...field} autoComplete="name" {...register('name')} />}
        </FormField>
        <FormField label="Headline" optional className="sm:col-span-2" error={errors.headline?.message}>
          {(field) => <TextInput {...field} placeholder="Backend Engineer" {...register('headline')} />}
        </FormField>

        <FormField label="Employment" error={errors.employment_status?.message}>
          {(field) => (
            <Select {...field} {...register('employment_status')}>
              {!profile.employment_status && <option value="">Select…</option>}
              {EMPLOYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {EMPLOYMENT_STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
          )}
        </FormField>
        {employmentStatus === 'EMPLOYED' && (
          <FormField label="Company" error={errors.company?.message}>
            {(field) => <TextInput {...field} autoComplete="organization" {...register('company')} />}
          </FormField>
        )}

        <FormField label="University" error={errors.university?.message}>
          {(field) => <TextInput {...field} placeholder="Cairo University" {...register('university')} />}
        </FormField>
        <FormField label="College" error={errors.college?.message}>
          {(field) => <TextInput {...field} placeholder="Faculty of Engineering" {...register('college')} />}
        </FormField>

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

        <FormField label="Location" optional error={errors.location?.message}>
          {(field) => <TextInput {...field} placeholder="Cairo, Egypt" {...register('location')} />}
        </FormField>
        <FormField label="Time zone" optional error={errors.timezone?.message}>
          {(field) => (
            <Select {...field} {...register('timezone')}>
              <option value="">Not specified</option>
              {TIME_ZONES.map((zone) => (
                <option key={zone} value={zone}>
                  {zone.replaceAll('_', ' ')}
                </option>
              ))}
            </Select>
          )}
        </FormField>
      </div>

      <FormField label="Bio" optional error={errors.bio?.message} hint="What are you preparing for? Share your focus areas.">
        {(field) => <Textarea {...field} rows={4} placeholder="Backend engineer preparing for system design rounds…" {...register('bio')} />}
      </FormField>

      <div className="grid gap-5 sm:grid-cols-3">
        <FormField label="LinkedIn" optional error={errors.linkedin_url?.message}>
          {(field) => <TextInput {...field} inputMode="url" placeholder="linkedin.com/in/you" {...register('linkedin_url')} />}
        </FormField>
        <FormField label="GitHub" optional error={errors.github_url?.message}>
          {(field) => <TextInput {...field} inputMode="url" placeholder="github.com/you" {...register('github_url')} />}
        </FormField>
        <FormField label="Portfolio" optional error={errors.portfolio_url?.message}>
          {(field) => <TextInput {...field} inputMode="url" placeholder="you.dev" {...register('portfolio_url')} />}
        </FormField>
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" {...register('show_email')} />
        <span>
          <span className="font-medium">Show my email on my public profile</span>
          <span className="block text-fg-muted">Other signed-in users will see {profile.email}.</span>
        </span>
      </label>

      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-5">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button variant="secondary" onClick={() => reset(toFormValues(profile))} disabled={!isDirty || isSubmitting}>
          Reset
        </Button>
        <Button type="submit" loading={isSubmitting} disabled={profile.profile_complete && !isDirty}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
