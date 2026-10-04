import { z } from 'zod'
import { INTERVIEW_TYPES, ROOM_SIZES } from '@/constants/enums'

// The request DTOs have no bean validation, but the service dereferences `startTime` (500 when missing)
// and a missing type produces a room with an undefined layout, so both are required here.
export const createInterviewSchema = z
  .object({
    mode: z.enum(['instant', 'scheduled']),
    interviewType: z.enum(INTERVIEW_TYPES, { message: 'Choose an interview type' }),
    roomSize: z.enum(ROOM_SIZES, { message: 'Choose a room size' }),
    title: z.string().max(120, 'Keep the title under 120 characters'),
    /** The creator's role (they're always the host). */
    ownerRole: z.enum(['INTERVIEWER', 'INTERVIEWEE']),
    accessPolicy: z.enum(['ASK_TO_JOIN', 'INVITE_ONLY', 'OPEN']),
    invitees: z.array(
      z.object({
        email: z.union([z.literal(''), z.email('Enter a valid email')]),
        role: z.enum(['INTERVIEWER', 'INTERVIEWEE', 'OBSERVER']),
      }),
    ),
    /** `datetime-local` value, interpreted in the browser's time zone. */
    startTime: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.mode !== 'scheduled') return
    const start = new Date(values.startTime)
    if (!values.startTime || Number.isNaN(start.getTime())) {
      ctx.addIssue({ code: 'custom', path: ['startTime'], message: 'Choose a start date and time' })
    } else if (start.getTime() <= Date.now()) {
      ctx.addIssue({ code: 'custom', path: ['startTime'], message: 'Start time must be in the future' })
    }
  })

export type CreateInterviewFormValues = z.infer<typeof createInterviewSchema>
