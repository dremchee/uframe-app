<script setup lang="ts">
import type { BaseBlockStyles, BlockStyles, PageBlock } from '@/core'
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { computed } from 'vue'
import { fontFamilyStack, serializeShadows } from '@/core'

const props = defineProps<{ editor: PageEditorInstance }>()

const tokens = computed(() => props.editor.variables.value)
const blocks = computed(() => {
  const result: PageBlock[] = []
  const visit = (items: PageBlock[]) => items.forEach((block) => {
    result.push(block)
    if (block.children)
      visit(block.children)
  })
  visit(props.editor.effectiveDocument.value.blocks)
  return result
})
const styleSources = computed<BlockStyles[]>(() => {
  const document = props.editor.effectiveDocument.value
  const styles: BlockStyles[] = [document.settings.style ?? {}, ...Object.values(document.styles ?? {})]
  const visit = (blocks: PageBlock[]) => blocks.forEach((block) => {
    if (block.style)
      styles.push(block.style)
    if (block.children)
      visit(block.children)
  })
  visit(document.blocks)
  return styles
})
const styleLayers = computed<BaseBlockStyles[]>(() => styleSources.value.flatMap((style) => {
  const { responsive, states, ...base } = style
  return [base, ...Object.values(states ?? {}), ...Object.values(responsive ?? {})]
}))
const styleValues = computed(() => {
  const result = new Map<string, string[]>()
  for (const style of styleLayers.value) {
    for (const [key, value] of Object.entries(style)) {
      if (value == null || value === '')
        continue
      const values = result.get(key) ?? []
      const label = String(value)
      if (!values.includes(label))
        result.set(key, [...values, label])
    }
  }
  return result
})
const styleValueFrequency = computed(() => {
  const counts = new Map<string, number>()
  for (const style of styleLayers.value) {
    for (const value of Object.values(style)) {
      if (value != null && value !== '') {
        const label = String(value)
        counts.set(label, (counts.get(label) ?? 0) + 1)
      }
    }
  }
  return counts
})
const colors = computed(() => {
  const colorTokens = tokens.value.filter(token => token.type === 'color')
  const values = colorTokens.map(token => ({
    name: token.name,
    value: resolveCssVariables(token.value),
  }))

  for (const key of ['color', 'backgroundColor', 'borderColor'] as const) {
    for (const value of styleValues.value.get(key) ?? []) {
      const variableKey = value.match(/^var\(--([\w-]+)\)$/)?.[1]
      const variable = variableKey
        ? colorTokens.find(token => token.key === variableKey)
        : colorTokens.find(token => resolveCssVariables(token.value) === value)
      values.push({
        name: variable?.name ?? '',
        value: variable ? resolveCssVariables(variable.value) : value,
      })
    }
  }

  return values.filter((entry, index) =>
    values.findIndex(candidate => candidate.value === entry.value) === index)
})
const fonts = computed(() => props.editor.fonts.value)
const properties = computed(() => [...styleValues.value]
  .filter(([key]) => !['color', 'backgroundColor', 'borderColor', 'fontFamily'].includes(key))
  .map(([name, values]) => ({ name, value: values.join(', ') })))
function collapsedProperty(name: string, matcher: RegExp, frequentOnly = true) {
  const values = [...styleValues.value]
    .filter(([key]) => matcher.test(key))
    .flatMap(([, values]) => values)
    .filter(value => !frequentOnly || (styleValueFrequency.value.get(value) ?? 0) > 1)
  return values.length ? { name, value: [...new Set(values)].join(', ') } : null
}
const spacingProperties = computed(() => [
  collapsedProperty('margin', /^margin/),
  collapsedProperty('padding', /^padding/),
  ...properties.value.filter(property => /^(?:gap|width|height|min|max)/.test(property.name) && property.value.split(', ').some(value => (styleValueFrequency.value.get(value) ?? 0) > 1)),
].filter((property): property is NonNullable<typeof property> => property != null))
const shapeProperties = computed(() => [collapsedProperty('border radius', /radius/i, false)]
  .filter((property): property is NonNullable<typeof property> => property != null))
const boxShadows = computed(() => {
  const values = styleLayers.value
    .map(style => serializeShadows(style.boxShadow))
    .filter(Boolean)
  return [...new Set(values)]
})
const typeScale = computed(() => {
  const steps = new Map<string, { weights: Set<string>, lineHeights: Set<string> }>()
  for (const style of styleLayers.value) {
    if (!style.fontSize)
      continue
    const size = String(style.fontSize)
    const step = steps.get(size) ?? { weights: new Set<string>(), lineHeights: new Set<string>() }
    step.weights.add(String(style.fontWeight ?? 400))
    step.lineHeights.add(String(style.lineHeight ?? 1))
    steps.set(size, step)
  }
  return [...steps]
    .sort(([a], [b]) => Number.parseFloat(b) - Number.parseFloat(a))
    .map(([size, step]) => ({
      size,
      weights: [...step.weights].join(', '),
      lineHeight: [...step.lineHeights][0] ?? '1',
    }))
})

const propertyFrequency = computed(() => {
  const counts = new Map<string, number>()
  for (const style of styleLayers.value) {
    for (const [key, value] of Object.entries(style)) {
      if (value != null && value !== '')
        counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }
  return [...counts]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }))
})
const responsiveMetrics = computed(() => {
  const layers = styleSources.value.flatMap(style => Object.entries(style.responsive ?? {}))
  const used = new Set(layers.map(([breakpoint]) => breakpoint))
  const properties = layers.reduce((total, [, style]) => total + Object.keys(style).length, 0)
  return { layers: layers.length, used: used.size, properties }
})
const tokenUsage = computed(() => {
  const serialized = styleLayers.value.flatMap(style => Object.values(style)).map(String).join(' ')
  const used = tokens.value.filter(token => serialized.includes(`var(--${token.key})`))
  return { used: used.length, unused: tokens.value.filter(token => !used.includes(token)) }
})
const styleEntryCount = computed(() => styleLayers.value.reduce((total, style) =>
  total + Object.values(style).filter(value => value != null && value !== '').length, 0))
const hardcodedValueCount = computed(() => styleLayers.value.reduce((total, style) =>
  total + Object.values(style).filter(value => typeof value === 'string' && value !== '' && !value.includes('var(--')).length, 0))
const singletonValueCount = computed(() => [...styleValueFrequency.value.values()].filter(count => count === 1).length)
const consistencyScore = computed(() => Math.max(0, Math.round(100
  - (tokenUsage.value.unused.length * 3)
  - Math.min(25, singletonValueCount.value)
  - (styleEntryCount.value ? (hardcodedValueCount.value / styleEntryCount.value) * 25 : 0))))
const summaryMetrics = computed(() => [
  { label: 'Consistency', value: `${consistencyScore.value}%` },
  { label: 'Styled blocks', value: `${blocks.value.filter(block => block.style || block.classes?.length).length}/${blocks.value.length}` },
  { label: 'Classes', value: Object.keys(props.editor.effectiveDocument.value.styles ?? {}).length },
  { label: 'Tokens used', value: `${tokenUsage.value.used}/${tokens.value.length}` },
])
const issues = computed(() => [
  tokenUsage.value.unused.length ? `${tokenUsage.value.unused.length} unused token${tokenUsage.value.unused.length === 1 ? '' : 's'}` : null,
  hardcodedValueCount.value ? `${hardcodedValueCount.value} hardcoded style values` : null,
  singletonValueCount.value ? `${singletonValueCount.value} one-off values` : null,
  responsiveMetrics.value.used < props.editor.breakpoints.value.length ? `${props.editor.breakpoints.value.length - responsiveMetrics.value.used} breakpoints without overrides` : null,
].filter((issue): issue is string => issue != null))

function resolveCssVariables(value: string): string {
  return value.replace(/var\(--([\w-]+)\)/g, (_match, key: string) =>
    tokens.value.find(token => token.key === key)?.value ?? _match)
}

function radiusPreview(value: string): string {
  return resolveCssVariables(value.split(',')[0] ?? value)
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <section>
      <p class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-uf-muted">
        Overview
      </p>
      <div class="grid grid-cols-2 gap-px overflow-hidden rounded-md bg-uf-border">
        <div v-for="metric in summaryMetrics" :key="metric.label" class="bg-uf-panel px-3 py-3">
          <p class="text-2xl font-semibold leading-none text-uf-text">
            {{ metric.value }}
          </p>
          <p class="mt-1 text-xs text-uf-muted">
            {{ metric.label }}
          </p>
        </div>
      </div>
    </section>
    <section v-if="propertyFrequency.length">
      <p class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-uf-muted">
        Usage
      </p>
      <div class="border-y border-uf-border">
        <div v-for="property in propertyFrequency" :key="property.name" class="grid grid-cols-[1fr_2fr_auto] items-center gap-3 border-b border-uf-border px-3 py-2 last:border-b-0">
          <code class="truncate text-xs text-uf-muted">{{ property.name }}</code>
          <span class="h-1.5 overflow-hidden rounded-full bg-uf-panel-muted"><span class="block h-full bg-uf-accent" :style="{ width: `${(property.count / propertyFrequency[0]!.count) * 100}%` }" /></span>
          <span class="text-xs tabular-nums text-uf-muted">{{ property.count }}</span>
        </div>
      </div>
    </section>
    <section v-if="colors.length">
      <p class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-uf-muted">
        Colors
      </p>
      <div class="grid grid-cols-2 gap-3">
        <div v-for="color in colors" :key="color.value" class="min-w-0">
          <span class="block h-14 rounded-lg shadow-xs" :style="{ backgroundColor: color.value }" />
          <div class="pt-1.5">
            <p v-if="color.name" class="truncate text-sm font-semibold">
              {{ color.name }}
            </p><p class="truncate text-xs text-uf-muted">
              {{ color.value }}
            </p>
          </div>
        </div>
      </div>
    </section>
    <section v-if="fonts.length || typeScale.length">
      <p class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-uf-muted">
        Typography
      </p>
      <div v-if="fonts.length" class="overflow-hidden bg-uf-panel">
        <div v-for="font in fonts" :key="font.family" class="border-b border-uf-border px-3 py-2.5 last:border-b-0">
          <div class="text-right text-xs text-uf-muted">
            {{ font.weights?.join(', ') || '400' }} · {{ font.provider }}
          </div>
          <p class="mt-1 text-5xl leading-none tracking-tight" :style="{ fontFamily: fontFamilyStack(font.family) }">
            {{ font.family }}
          </p>
        </div>
      </div>
      <div v-if="typeScale.length" class="mt-3 overflow-hidden bg-uf-panel">
        <div v-for="step in typeScale" :key="step.size" class="border-b border-uf-border px-3 py-2 last:border-b-0">
          <div class="flex items-baseline justify-between gap-2 text-xs text-uf-muted">
            <code>{{ step.size }}</code><span>{{ step.weights }} · {{ step.lineHeight }}</span>
          </div>
          <p class="mt-1" :style="{ fontSize: step.size, lineHeight: step.lineHeight, fontFamily: fonts[0] ? fontFamilyStack(fonts[0].family) : undefined }">
            The quick brown fox jumps
          </p>
        </div>
      </div>
    </section>
    <section v-if="spacingProperties.length || shapeProperties.length || boxShadows.length">
      <p class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-uf-muted">
        Spacing &amp; shape
      </p>
      <div v-if="spacingProperties.length" class="overflow-hidden bg-uf-panel">
        <div class="grid grid-cols-[1fr_auto_44px] gap-2 border-b border-uf-border px-3 py-2 text-xs font-medium text-uf-muted">
          <span>Purpose</span><span>Value</span><span>Preview</span>
        </div>
        <div v-for="property in spacingProperties" :key="property.name" class="grid grid-cols-[1fr_auto_44px] items-center gap-2 border-b border-uf-border px-3 py-2 last:border-b-0">
          <span class="min-w-0 truncate text-sm">{{ property.name }}</span><code class="max-w-24 truncate text-xs text-uf-muted">{{ property.value }}</code><span class="h-2 rounded-sm bg-uf-muted/50" :style="{ width: `min(44px, ${property.value})` }" />
        </div>
      </div>
      <div v-if="shapeProperties.length" class="mt-3 overflow-hidden bg-uf-panel">
        <div class="grid grid-cols-[44px_1fr_auto] gap-2 border-b border-uf-border px-3 py-2 text-xs font-medium text-uf-muted">
          <span>Preview</span><span>Element</span><span>Value</span>
        </div>
        <div v-for="property in shapeProperties" :key="property.name" class="grid grid-cols-[44px_1fr_auto] items-center gap-2 border-b border-uf-border px-3 py-2 last:border-b-0">
          <span v-if="property.name.toLowerCase().includes('radius')" class="relative size-8 overflow-hidden">
            <span class="absolute left-0 top-0 size-10 border border-r-0 border-b-0 border-uf-muted/70" :style="{ borderTopLeftRadius: radiusPreview(property.value) }" />
          </span>
          <span v-else class="size-6 border border-uf-muted/50 bg-uf-panel-muted" />
          <span class="min-w-0 truncate text-sm">{{ property.name }}</span><code class="max-w-24 truncate text-xs text-uf-muted">{{ resolveCssVariables(property.value) }}</code>
        </div>
      </div>
      <div v-if="boxShadows.length" class="mt-3 overflow-hidden bg-uf-panel">
        <div class="grid grid-cols-[1fr_44px] gap-2 border-b border-uf-border px-3 py-2 text-xs font-medium text-uf-muted">
          <span>Shadow</span><span>Preview</span>
        </div>
        <div v-for="shadow in boxShadows" :key="shadow" class="grid grid-cols-[1fr_44px] items-center gap-2 border-b border-uf-border px-3 py-2 last:border-b-0">
          <code class="min-w-0 truncate text-xs text-uf-muted">{{ shadow }}</code><span class="size-7 rounded-md bg-uf-panel-muted" :style="{ boxShadow: shadow }" />
        </div>
      </div>
    </section>
    <section>
      <p class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-uf-muted">
        Responsive
      </p>
      <div class="grid grid-cols-3 gap-px overflow-hidden rounded-md bg-uf-border">
        <div class="bg-uf-panel px-3 py-2">
          <p class="text-lg font-semibold">
            {{ responsiveMetrics.used }}
          </p><p class="text-[10px] text-uf-muted">
            Breakpoints used
          </p>
        </div>
        <div class="bg-uf-panel px-3 py-2">
          <p class="text-lg font-semibold">
            {{ responsiveMetrics.layers }}
          </p><p class="text-[10px] text-uf-muted">
            Override layers
          </p>
        </div>
        <div class="bg-uf-panel px-3 py-2">
          <p class="text-lg font-semibold">
            {{ responsiveMetrics.properties }}
          </p><p class="text-[10px] text-uf-muted">
            Properties
          </p>
        </div>
      </div>
    </section>
    <section>
      <p class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-uf-muted">
        Issues
      </p>
      <div v-if="issues.length" class="border-y border-uf-border">
        <div v-for="issue in issues" :key="issue" class="flex items-center gap-2 border-b border-uf-border px-3 py-2 text-sm last:border-b-0">
          <span class="size-1.5 shrink-0 rounded-full bg-amber-500" />{{ issue }}
        </div>
      </div>
      <p v-else class="text-sm text-uf-muted">
        No obvious consistency issues found.
      </p>
    </section>
    <p v-if="!tokens.length && !fonts.length" class="m-0 text-[11px] leading-snug text-uf-muted">
      Add colors, fonts, and variables to build this template guide.
    </p>
  </div>
</template>
