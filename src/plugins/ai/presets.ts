// Role/style presets and quick-start suggestions for the AI chat. Presets append
// guidance to the base system prompt (they never replace the JSON contract);
// suggestions are scope-aware starter prompts shown in the empty chat.

export type ScopeKind = 'page' | 'container' | 'block'

export interface AiPreset {
  id: string
  label: string
  /** Appended to the base system prompt. Empty = neutral. */
  instruction: string
}

export const AI_PRESETS: AiPreset[] = [
  { id: 'auto', label: 'Auto', instruction: '' },
  {
    id: 'landing',
    label: 'Landing',
    instruction: 'Design like a marketing landing page: a strong hero, clear benefits, social proof and a prominent call to action. Write persuasive marketing copy.',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    instruction: 'Use a minimal aesthetic: generous whitespace, a restrained palette, large clean typography and no decorative clutter.',
  },
  {
    id: 'bold',
    label: 'Bold',
    instruction: 'Use a bold editorial aesthetic: high-contrast typography, a confident accent color and a magazine-style layout.',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    instruction: 'Design dense app/dashboard UI: cards, tables, stats and status indicators, with a scannable information hierarchy.',
  },
  {
    id: 'match',
    label: 'Match design',
    instruction: 'Reuse colors, CSS variables and classes visible in the current scope. Do not invent design tokens that are not present in that scope.',
  },
  {
    id: 'copy',
    label: 'Copywriting',
    instruction: 'Prioritize the writing: compelling headlines, subheadings and concise microcopy that fit the context.',
  },
]

export function presetInstruction(id: string): string {
  return AI_PRESETS.find(p => p.id === id)?.instruction ?? ''
}

export function presetLabel(id: string): string {
  return AI_PRESETS.find(p => p.id === id)?.label ?? 'Auto'
}

export const AI_SUGGESTIONS: Record<ScopeKind, string[]> = {
  page: [
    'Build a SaaS landing page',
    'Create an About page',
    'Add a pricing section',
    'Make a contact page',
  ],
  container: [
    'Turn this into a 3-column feature grid',
    'Add a CTA with a heading and button',
    'Improve spacing and hierarchy',
    'Rewrite the copy to be punchier',
  ],
  block: [
    'Make this bigger and bolder',
    'Match the colors to the brand',
    'Shorten the text',
  ],
}
