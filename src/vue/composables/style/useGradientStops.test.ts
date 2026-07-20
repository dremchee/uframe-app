import type { GradientValue } from '@/core'
import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useGradientStops } from './useGradientStops'

function createStops(stops: GradientValue['stops']) {
  const gradient = ref<GradientValue>({ type: 'linear', angle: 90, stops })
  const track = ref<HTMLElement | null>(null)
  const controls = useGradientStops({
    gradient,
    track,
    update: (value) => { gradient.value = value },
  })
  return { controls, gradient }
}

describe('useGradientStops', () => {
  it('adds a stop midway between the final two stops and selects it', () => {
    const { controls, gradient } = createStops([
      { id: 'start', color: '#000000', position: 0 },
      { id: 'end', color: '#ffffff', position: 100 },
    ])

    controls.addStop()

    expect(gradient.value.stops).toEqual([
      { id: 'start', color: '#000000', position: 0 },
      { id: 'gs-1', color: '#000000', position: 50 },
      { id: 'end', color: '#ffffff', position: 100 },
    ])
    expect(controls.activeStop.value).toBe(1)
  })

  it('keeps two-stop gradients intact and sorts manual position edits', () => {
    const { controls, gradient } = createStops([
      { id: 'first', color: '#000000', position: 20 },
      { id: 'second', color: '#ffffff', position: 80 },
    ])

    controls.removeStop(0)
    expect(gradient.value.stops).toHaveLength(2)

    controls.setStopPosition(0, '90%')
    controls.sortStops()

    expect(gradient.value.stops.map(stop => stop.id)).toEqual(['second', 'first'])
    expect(gradient.value.stops.map(stop => stop.position)).toEqual([80, 90])
  })
})
