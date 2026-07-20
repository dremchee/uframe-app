import { describe, expect, it } from 'vitest'
import { removeInstancePropertyValue, setInstancePropertyValue } from './symbol-properties'

describe('symbol property values', () => {
  it('updates an override immutably', () => {
    const props = { propertyValues: { title: 'Old' }, other: true }
    expect(setInstancePropertyValue(props, 'title', 'New')).toEqual({ propertyValues: { title: 'New' }, other: true })
    expect(props).toEqual({ propertyValues: { title: 'Old' }, other: true })
  })

  it('removes the container after its final override', () => {
    expect(removeInstancePropertyValue({ propertyValues: { title: 'Text' }, other: true }, 'title')).toEqual({ other: true })
  })
})
