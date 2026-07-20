export type CalloutTone = 'info' | 'success' | 'warning' | 'danger'

export interface CalloutProps {
  tone: CalloutTone
  text: string
}
