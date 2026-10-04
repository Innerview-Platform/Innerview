import { z } from 'zod'
import { EXPERIENCE_LEVELS, INTERVIEW_ROLES } from '@/constants/enums'

// CreateProfileRequest has no bean validation; every field is optional server-side.
// `image_url` maps to a VARCHAR(255) column and is rendered as an <img>, hence the URL/length checks.
export const profileSchema = z.object({
  experience_level: z.enum(EXPERIENCE_LEVELS).or(z.literal('')),
  preferred_role: z.enum(INTERVIEW_ROLES).or(z.literal('')),
  bio: z.string(),
  image_url: z
    .string()
    .trim()
    .max(255, 'Image URL must be 255 characters or fewer')
    .refine((value) => !value || /^https?:\/\/\S+$/i.test(value), 'Enter a valid http(s) URL'),
})

export type ProfileFormValues = z.infer<typeof profileSchema>
