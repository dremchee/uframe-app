import { describe, expect, it } from 'vitest'
import { appendListItem, insertListItem, moveListItem, removeListItem, replaceListItem } from './list'

describe('immutable list utilities', () => {
  it('does not mutate the source while appending, replacing, and removing', () => {
    const source = ['a', 'b', 'c']
    expect(appendListItem(source, 'd')).toEqual(['a', 'b', 'c', 'd'])
    expect(insertListItem(source, 1, 'x')).toEqual(['a', 'x', 'b', 'c'])
    expect(replaceListItem(source, 1, 'x')).toEqual(['a', 'x', 'c'])
    expect(removeListItem(source, 1)).toEqual(['a', 'c'])
    expect(source).toEqual(['a', 'b', 'c'])
  })

  it('moves an item to a new position', () => {
    expect(moveListItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a'])
  })

  it('clamps insert positions to the bounds of the list', () => {
    expect(insertListItem(['b'], -1, 'a')).toEqual(['a', 'b'])
    expect(insertListItem(['a'], 99, 'b')).toEqual(['a', 'b'])
  })

  it('leaves the list intact when replacing an item outside its bounds', () => {
    expect(replaceListItem(['a'], -1, 'x')).toEqual(['a'])
    expect(replaceListItem(['a'], 1, 'x')).toEqual(['a'])
    expect(replaceListItem(['a'], 0.5, 'x')).toEqual(['a'])
  })

  it('leaves the list intact when removing or moving with an invalid index', () => {
    expect(removeListItem(['a', 'b'], -1)).toEqual(['a', 'b'])
    expect(removeListItem(['a', 'b'], 2)).toEqual(['a', 'b'])
    expect(moveListItem(['a', 'b'], -1, 0)).toEqual(['a', 'b'])
    expect(moveListItem(['a', 'b'], 0, 2)).toEqual(['a', 'b'])
  })
})
