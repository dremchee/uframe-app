import { splitCssTopLevel } from '@/core/utils/css-tokenizer'

export type RadialShape = 'circle' | 'ellipse'

export interface GradientStop {
  id: string
  color: string
  position: number
}

export interface LinearGradientValue {
  type: 'linear'
  angle: number
  stops: GradientStop[]
}

export interface RadialGradientValue {
  type: 'radial'
  shape: RadialShape
  position: string
  stops: GradientStop[]
}

export type GradientValue = LinearGradientValue | RadialGradientValue

const LINEAR_RE = /^(?:repeating-)?linear-gradient\((.*)\)$/is
const RADIAL_RE = /^(?:repeating-)?radial-gradient\((.*)\)$/is
const ANGLE_RE = /^(-?(?:\d+(?:\.\d+)?|\.\d+))(deg|grad|rad|turn)$/i

function isLinearDirection(seg: string): boolean {
  return /^to\s/i.test(seg) || ANGLE_RE.test(seg.trim())
}

function isRadialConfig(seg: string): boolean {
  return /\b(?:circle|ellipse|closest|farthest)\b/i.test(seg) || /\bat\b/i.test(seg)
}

function parseDirection(seg: string): number {
  const s = seg.trim()
  if (/^to\s/i.test(s)) {
    const sides = new Set(s.slice(2).trim().toLowerCase().split(/\s+/))
    const top = sides.has('top')
    const bottom = sides.has('bottom')
    const left = sides.has('left')
    const right = sides.has('right')
    if (top && right)
      return 45
    if (bottom && right)
      return 135
    if (bottom && left)
      return 225
    if (top && left)
      return 315
    if (top)
      return 0
    if (right)
      return 90
    if (bottom)
      return 180
    if (left)
      return 270
    return 180
  }
  const m = ANGLE_RE.exec(s)
  if (!m)
    return 180
  const n = Number.parseFloat(m[1])
  switch (m[2].toLowerCase()) {
    case 'turn':
      return Math.round(n * 360)
    case 'rad':
      return Math.round((n * 180) / Math.PI)
    case 'grad':
      return Math.round(n * 0.9)
    default:
      return Math.round(n)
  }
}

const PERCENT_RE = /^(-?(?:\d+(?:\.\d+)?|\.\d+))%$/

function parseStops(segments: string[]): GradientStop[] {
  const parsed = segments.map((seg) => {
    let color = ''
    let position: number | null = null
    for (const token of splitCssTopLevel(seg, 'space')) {
      const pct = PERCENT_RE.exec(token)
      if (pct && position === null)
        position = Number.parseFloat(pct[1])
      else if (!pct)
        color = color ? `${color} ${token}` : token
    }
    return { color: color || '#000000', position }
  })
  const n = parsed.length
  return parsed.map((stop, i) => ({
    id: `gs-${i}`,
    color: stop.color,
    position: stop.position ?? (n > 1 ? Math.round((i / (n - 1)) * 100) : 0),
  }))
}

export function parseGradient(value: string | undefined | null): GradientValue | null {
  const v = value?.trim()
  if (!v)
    return null

  const linear = LINEAR_RE.exec(v)
  if (linear) {
    const segs = splitCssTopLevel(linear[1], 'comma')
    let angle = 180
    let stopSegs = segs
    if (segs.length && isLinearDirection(segs[0])) {
      angle = parseDirection(segs[0])
      stopSegs = segs.slice(1)
    }
    const stops = parseStops(stopSegs)
    return { type: 'linear', angle, stops: stops.length ? stops : defaultGradientStops() }
  }

  const radial = RADIAL_RE.exec(v)
  if (radial) {
    const segs = splitCssTopLevel(radial[1], 'comma')
    let shape: RadialShape = 'ellipse'
    let position = 'center'
    let stopSegs = segs
    if (segs.length && isRadialConfig(segs[0])) {
      shape = /\bcircle\b/i.test(segs[0]) ? 'circle' : 'ellipse'
      const at = /\bat\s+(\S.*)$/i.exec(segs[0])
      if (at)
        position = at[1].trim()
      stopSegs = segs.slice(1)
    }
    const stops = parseStops(stopSegs)
    return { type: 'radial', shape, position, stops: stops.length ? stops : defaultGradientStops() }
  }

  return null
}

export function serializeGradient(gradient: GradientValue): string {
  const stops = gradient.stops.map(s => `${s.color} ${s.position}%`).join(', ')
  if (gradient.type === 'linear')
    return `linear-gradient(${gradient.angle}deg, ${stops})`
  return `radial-gradient(${gradient.shape} at ${gradient.position}, ${stops})`
}

export function defaultGradientStops(): GradientStop[] {
  return [
    { id: 'gs-0', color: '#ffffff', position: 0 },
    { id: 'gs-1', color: '#000000', position: 100 },
  ]
}

export function defaultLinearGradient(): LinearGradientValue {
  return { type: 'linear', angle: 180, stops: defaultGradientStops() }
}

export function defaultRadialGradient(): RadialGradientValue {
  return { type: 'radial', shape: 'circle', position: 'center', stops: defaultGradientStops() }
}

export const RADIAL_POSITIONS = [
  'center',
  'top',
  'bottom',
  'left',
  'right',
  'top left',
  'top right',
  'bottom left',
  'bottom right',
] as const
