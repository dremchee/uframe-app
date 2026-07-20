import { isRecord } from '@/core/utils/records'

/** Immutable helpers for component-instance property overrides. */
export function setInstancePropertyValue(props: Record<string, unknown>, propertyId: string, value: unknown): Record<string, unknown> {
  const current = props.propertyValues
  const propertyValues = isRecord(current)
    ? { ...current }
    : {}
  propertyValues[propertyId] = value
  return { ...props, propertyValues }
}

export function removeInstancePropertyValue(props: Record<string, unknown>, propertyId: string): Record<string, unknown> {
  const current = props.propertyValues
  if (!isRecord(current) || !Object.hasOwn(current, propertyId))
    return props
  const propertyValues = { ...current }
  delete propertyValues[propertyId]
  if (Object.keys(propertyValues).length)
    return { ...props, propertyValues }
  const { propertyValues: _removed, ...rest } = props
  return rest
}
