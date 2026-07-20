// Reka overlays (Select/Popover/Dropdown/Tooltip/Dialog) portal to <body> and
// all carry the shared `.uf-overlay` marker. An interaction that lands inside
// one must NOT dismiss a parent popover or the sidebar flyout. Bind this to a
// PopoverContent's `@interact-outside` / `@focus-outside`.
export function preventOverlayDismiss(event: Event) {
  const detail = (event as CustomEvent<{ originalEvent?: Event }>).detail
  const target = (detail?.originalEvent?.target ?? event.target) as Element | null
  // A nested overlay (e.g. a Select) sets pointer-events:none on the layers
  // beneath it while open, so the pointerdown that dismisses it lands on the
  // document root rather than a real element. That isn't a genuine outside
  // interaction — keep the parent overlay open.
  if (!target || target === document.documentElement || target === document.body) {
    event.preventDefault()
    return
  }
  if (target.closest?.('.uf-overlay'))
    event.preventDefault()
}
