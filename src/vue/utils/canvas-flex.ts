export interface FlexHandle {
  axis: 'col' | 'row'
  id: string
  x: number
  y: number
  band: { left: number, top: number, width: number, height: number }
}

export interface FlexItemBox {
  id: string
  rect: { top: number, right: number, bottom: number, left: number }
  margin: { top: number, right: number, bottom: number, left: number }
}

export interface FlexGapGeometry {
  row: boolean
  content: { top: number, right: number, bottom: number, left: number }
  items: FlexItemBox[]
}

/** Builds stable gap grips from rendered flex-item border and margin boxes. */
export function buildFlexGapHandles({ row, content, items }: FlexGapGeometry): FlexHandle[] {
  const mainStart = (item: FlexItemBox) => (row ? item.rect.left : item.rect.top)
  const crossStart = (item: FlexItemBox) => (row ? item.rect.top : item.rect.left)
  const crossEnd = (item: FlexItemBox) => (row ? item.rect.bottom : item.rect.right)
  const marginMainEnd = (item: FlexItemBox) => (row ? item.rect.right + item.margin.right : item.rect.bottom + item.margin.bottom)
  const marginMainStart = (item: FlexItemBox) => (row ? item.rect.left - item.margin.left : item.rect.top - item.margin.top)
  const marginCrossStart = (item: FlexItemBox) => (row ? item.rect.top - item.margin.top : item.rect.left - item.margin.left)
  const marginCrossEnd = (item: FlexItemBox) => (row ? item.rect.bottom + item.margin.bottom : item.rect.right + item.margin.right)

  interface Line {
    items: FlexItemBox[]
    crossStart: number
    crossEnd: number
    marginCrossStart: number
    marginCrossEnd: number
  }

  const lines: Line[] = []
  let previousMain = Number.NEGATIVE_INFINITY
  for (const item of items) {
    const line = lines.at(-1)
    if (line && mainStart(item) > previousMain) {
      line.items.push(item)
      line.crossStart = Math.min(line.crossStart, crossStart(item))
      line.crossEnd = Math.max(line.crossEnd, crossEnd(item))
      line.marginCrossStart = Math.min(line.marginCrossStart, marginCrossStart(item))
      line.marginCrossEnd = Math.max(line.marginCrossEnd, marginCrossEnd(item))
    }
    else {
      lines.push({
        items: [item],
        crossStart: crossStart(item),
        crossEnd: crossEnd(item),
        marginCrossStart: marginCrossStart(item),
        marginCrossEnd: marginCrossEnd(item),
      })
    }
    previousMain = mainStart(item)
  }

  const handles: FlexHandle[] = []
  const mainGapAxis = row ? 'col' : 'row'
  const crossGapAxis = row ? 'row' : 'col'
  const contentMainStart = row ? content.left : content.top
  const contentMainEnd = row ? content.right : content.bottom
  const push = (axis: 'col' | 'row', id: string, mainStart: number, mainEnd: number, crossStart: number, crossEnd: number) => {
    if (mainEnd < mainStart)
      return
    const band = row
      ? { left: mainStart, top: crossStart, width: mainEnd - mainStart, height: crossEnd - crossStart }
      : { left: crossStart, top: mainStart, width: crossEnd - crossStart, height: mainEnd - mainStart }
    handles.push({ axis, id, x: band.left + band.width / 2, y: band.top + band.height / 2, band })
  }

  for (const line of lines) {
    for (let index = 0; index < line.items.length - 1; index++) {
      const before = line.items[index]!
      const after = line.items[index + 1]!
      push(mainGapAxis, `${before.id}|${after.id}`, marginMainEnd(before), marginMainStart(after), line.crossStart, line.crossEnd)
    }
  }

  for (let index = 0; index < lines.length - 1; index++) {
    const before = lines[index]!
    const after = lines[index + 1]!
    push(crossGapAxis, `${before.items.at(-1)!.id}|${after.items[0]!.id}`, contentMainStart, contentMainEnd, before.marginCrossEnd, after.marginCrossStart)
  }

  return handles
}
