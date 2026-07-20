import type { Component } from 'vue'
import type { BlockDefinition } from '@/core'

export type VueBlockDefinition<TProps = Record<string, unknown>> = BlockDefinition<TProps, Component>

/** Renders a flag-style HTML attribute when the value is truthy. */
export function boolAttr(name: string, value: boolean | undefined) {
  return value ? ` ${name}` : ''
}
