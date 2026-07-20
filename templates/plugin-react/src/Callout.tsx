import type { CalloutProps } from './shared'

// Plain React component. Display-only — editing happens in the editor's
// schema-driven settings form. No styles here: the block's CSS lives in the
// co-located `callout.css`, imported as a string for the definition's `css`
// field; the editor (or the standalone playground) injects it. renderHtml emits
// the same classes.
export default function Callout({ tone = 'info', text = 'Heads up!' }: Partial<CalloutProps>) {
  return (
    <div className={`uf-callout-block uf-callout-block--${tone}`}>
      {text || 'Callout text…'}
    </div>
  )
}
