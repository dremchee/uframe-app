import { z } from 'zod'

export const calloutTones = ['info', 'success', 'warning', 'danger'] as const
export type CalloutTone = typeof calloutTones[number]

// Props schema — the editor validates a block's props against this on load,
// and the schema can also drive auto-generated settings later.
export const calloutPropsSchema = z.object({
  tone: z.enum(calloutTones),
  text: z.string(),
})

export type CalloutProps = z.infer<typeof calloutPropsSchema>
