import type { GridBox } from '@/vue/composables/canvas/useCanvasOverlays'

export interface GridGuideLine {
  key: string
  vertical: boolean
  style: Record<string, string>
}

export interface GridGuides {
  lines: GridGuideLine[]
  outline: Record<string, string>
}

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)

/** Builds the visual guide lines and content outline for resolved grid geometry. */
export function buildGridGuides(box: GridBox): GridGuides | null {
  const { rect, offsetLeft, offsetTop, columns, rows, columnGap, rowGap } = box
  if (!columns.length && !rows.length)
    return null

  const contentLeft = rect.left + offsetLeft
  const contentTop = rect.top + offsetTop
  const contentWidth = columns.length ? sum(columns) + (columns.length - 1) * columnGap : rect.width - offsetLeft
  const contentHeight = rows.length ? sum(rows) + (rows.length - 1) * rowGap : rect.height - offsetTop
  const lines: GridGuideLine[] = []

  let x = contentLeft
  for (let index = 0; index < columns.length; index++) {
    x += columns[index]!
    if (index < columns.length - 1) {
      lines.push({ key: `cl-${index}a`, vertical: true, style: { left: `${x}px`, top: `${contentTop}px`, height: `${contentHeight}px` } })
      if (columnGap > 0)
        lines.push({ key: `cl-${index}b`, vertical: true, style: { left: `${x + columnGap}px`, top: `${contentTop}px`, height: `${contentHeight}px` } })
      x += columnGap
    }
  }

  let y = contentTop
  for (let index = 0; index < rows.length; index++) {
    y += rows[index]!
    if (index < rows.length - 1) {
      lines.push({ key: `rl-${index}a`, vertical: false, style: { left: `${contentLeft}px`, top: `${y}px`, width: `${contentWidth}px` } })
      if (rowGap > 0)
        lines.push({ key: `rl-${index}b`, vertical: false, style: { left: `${contentLeft}px`, top: `${y + rowGap}px`, width: `${contentWidth}px` } })
      y += rowGap
    }
  }

  return {
    lines,
    outline: { left: `${contentLeft}px`, top: `${contentTop}px`, width: `${contentWidth}px`, height: `${contentHeight}px` },
  }
}
