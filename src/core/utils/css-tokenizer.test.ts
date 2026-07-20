import { describe, expect, it } from 'vitest'
import { splitCssTopLevel } from './css-tokenizer'

describe('splitCssTopLevel', () => {
  it('does not split commas inside CSS functions', () => {
    expect(splitCssTopLevel('rgba(0, 0, 0, 0.2), #fff', 'comma')).toEqual(['rgba(0, 0, 0, 0.2)', '#fff'])
  })

  it('does not split spaces inside CSS functions', () => {
    expect(splitCssTopLevel('0 2px 4px rgba(0, 0, 0, 0.2)', 'space')).toEqual(['0', '2px', '4px', 'rgba(0, 0, 0, 0.2)'])
  })
})
