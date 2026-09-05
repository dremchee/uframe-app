export interface PanelRect { left: number, top: number, width: number, height: number }
const MARGIN = 12
const GAP = 12
export const clampPanel = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max))

/** Prefer space outside the selection; dock at the bottom when none fits. */
export function placeCanvasPanel(pane: PanelRect, selection: PanelRect | null, size: { width: number, height: number }) {
  const left = pane.left + MARGIN
  const top = pane.top + MARGIN
  const right = pane.left + pane.width - MARGIN
  const bottom = pane.top + pane.height - MARGIN
  const width = Math.min(size.width, Math.max(0, pane.width - 2 * MARGIN))
  const height = size.height
  if (selection) {
    const x = clampPanel(selection.left, left, right - width)
    const y = clampPanel(selection.top, top, bottom - height)
    const candidates = [
      { left: selection.left + selection.width + GAP, top: y },
      { left: selection.left - width - GAP, top: y },
      { left: x, top: selection.top + selection.height + 32 },
      { left: x, top: selection.top - height - GAP },
    ]
    const fit = candidates.find(candidate => candidate.left >= left && candidate.top >= top
      && candidate.left + width <= right && candidate.top + height <= bottom)
    if (fit)
      return { ...fit, docked: false }
  }
  return { left, top: Math.max(top, bottom - Math.min(height, 140)), docked: true }
}
