import { z } from 'zod'
import { EMPLOYMENT_STATUSES, EXPERIENCE_LEVELS, INTERVIEW_ROLES } from '@/constants/enums'

// Mirrors UpdateProfileRequest (@Size limits) and ProfileFieldRules on the backend.

const optionalText = (max: number, label: string) => z.string().trim().max(max, `${label} must be at most ${max} characters`)

/** Empty, or a link the backend will accept (it adds https:// when missing). */
const optionalLink = (label: string, site?: string) =>
  optionalText(255, label).refine((value) => {
    if (!value) return true
    try {
      const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
      const host = url.hostname.toLowerCase()
      return url.protocol === 'https:' && host.includes('.') && (!site || host === site || host.endsWith(`.${site}`))
    } catch {
      return false
    }
  }, site ? `Enter a ${site} link` : 'Enter a valid https:// link')

/** Mirrors UsernameRules on the backend (which also rejects reserved names such as "me"). */
export const USERNAME_MIN = 3
export const USERNAME_MAX = 30
export function usernameFormatProblem(raw: string): string | null {
  const username = raw.trim().toLowerCase()
  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) return `Username must be ${USERNAME_MIN}–${USERNAME_MAX} characters.`
  if (!/^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/.test(username)) {
    return "Use lowercase letters, numbers, '.', '_' or '-', starting and ending with a letter or number."
  }
  if (/[._-]{2}/.test(username)) return "Username can't have two '.', '_' or '-' in a row."
  return null
}

const usernameField = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    const problem = usernameFormatProblem(value)
    if (problem) ctx.addIssue({ code: 'custom', message: value ? problem : 'Username is required' })
  })

/** Fields every account must have; shared with the sign-up form. */
export const requiredProfileFields = {
  username: usernameField,
  employment_status: z.enum(EMPLOYMENT_STATUSES, { message: 'Employment status is required' }),
  company: optionalText(100, 'Company'),
  university: optionalText(150, 'University').min(1, 'University is required'),
  college: optionalText(150, 'College').min(1, 'College is required'),
  headline: optionalText(120, 'Headline'),
}

/** A company is required when employed (EMPLOYED); the backend drops it otherwise. */
export function companyRequiredWhenEmployed(values: { employment_status?: string; company: string }, ctx: z.RefinementCtx) {
  if (values.employment_status === 'EMPLOYED' && !values.company.trim()) {
    ctx.addIssue({ code: 'custom', path: ['company'], message: 'Company is required' })
  }
}

export const profileSchema = z
  .object({
    name: z.string().trim().min(3, 'Name must be at least 3 characters long').max(100, 'Name must be at most 100 characters'),
    ...requiredProfileFields,
    experience_level: z.enum(EXPERIENCE_LEVELS).or(z.literal('')),
    preferred_role: z.enum(INTERVIEW_ROLES).or(z.literal('')),
    bio: optionalText(2000, 'Bio'),
    location: optionalText(100, 'Location'),
    timezone: optionalText(64, 'Time zone'),
    linkedin_url: optionalLink('LinkedIn URL', 'linkedin.com'),
    github_url: optionalLink('GitHub URL', 'github.com'),
    portfolio_url: optionalLink('Portfolio URL'),
    show_email: z.boolean(),
  })
  .superRefine(companyRequiredWhenEmployed)

export type ProfileFormValues = z.infer<typeof profileSchema>
