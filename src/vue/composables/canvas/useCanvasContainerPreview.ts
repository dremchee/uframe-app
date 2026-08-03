import type { Ref } from 'vue'
import type { Rect } from './canvas-overlay-types'
import type { ContainerPreviewChannel, PageEditorInstance } from '@/vue/context/editor-context'
import { useEventListener } from '@vueuse/core'
import { nextTick, onBeforeUnmount, shallowRef, watch } from 'vue'
import { findCanvasBlockWrapper, findRenderedBlockElement } from '@/vue/utils/canvas-dom'

interface StoredProperty {
  value: string
  priority: string
}

type PreviewProperty = 'display' | 'width' | 'min-width' | 'max-width' | 'flex' | 'margin-left' | 'margin-right' | 'container-type' | 'container-name'

interface StoredStyles {
  /** The authored block whose geometry drives the controls and dimming. */
  element: HTMLElement
  /** Canvas-only parent used as the temporary query container. */
  contextElement: HTMLElement
  properties: Record<PreviewProperty, StoredProperty>
}

export interface UseCanvasContainerPreviewOptions {
  editor: PageEditorInstance
  preview: ContainerPreviewChannel
  iframeDoc: Ref<Document | null>
  iframeWin: Ref<Window | null>
}

const PREVIEW_PROPERTIES: PreviewProperty[] = [
  'display',
  'width',
  'min-width',
  'max-width',
  'flex',
  'margin-left',
  'margin-right',
  'container-type',
  'container-name',
]

function parsePixels(value: string): number {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Uses a canvas-only wrapper as the temporary query container. This keeps the
 * authored target as its descendant, which allows @container rules to style it.
 */
export function useCanvasContainerPreview(options: UseCanvasContainerPreviewOptions) {
  const { editor, preview, iframeDoc, iframeWin } = options
  const rect = shallowRef<Rect | null>(null)
  let resizeObserver: ResizeObserver | null = null
  let storedStyles: StoredStyles | null = null

  function restoreStoredStyles() {
    const stored = storedStyles
    if (!stored)
      return

    restoreProperties(stored)
    storedStyles = null
  }

  function restoreProperties(stored: StoredStyles) {
    for (const property of PREVIEW_PROPERTIES) {
      const original = stored.properties[property]
      if (original.value)
        stored.contextElement.style.setProperty(property, original.value, original.priority)
      else
        stored.contextElement.style.removeProperty(property)
    }
  }

  function stopObserving() {
    resizeObserver?.disconnect()
    resizeObserver = null
    restoreStoredStyles()
    rect.value = null
  }

  function targetElement(): HTMLElement | null {
    const win = iframeWin.value as (Window & typeof globalThis) | null
    const element = findRenderedBlockElement(
      iframeDoc.value,
      win,
      preview.blockId.value,
    )
    return element && win && 'style' in element ? element as HTMLElement : null
  }

  function contextElement(): HTMLElement | null {
    return findCanvasBlockWrapper(iframeDoc.value, preview.blockId.value)
  }

  function measure() {
    const element = storedStyles?.element ?? targetElement()
    const win = iframeWin.value
    if (!element || !win) {
      rect.value = null
      preview.reportWidth(null)
      return
    }

    const bounds = element.getBoundingClientRect()
    const style = win.getComputedStyle(element)
    const inlineChrome = parsePixels(style.borderLeftWidth)
      + parsePixels(style.paddingLeft)
      + parsePixels(style.paddingRight)
      + parsePixels(style.borderRightWidth)

    rect.value = {
      top: bounds.top,
      left: bounds.left,
      width: bounds.width,
      height: bounds.height,
    }
    preview.reportWidth(Math.max(0, Math.round(bounds.width - inlineChrome)))
  }

  function applyOverride() {
    const stored = storedStyles
    const element = stored?.contextElement
    const win = iframeWin.value
    if (!element || !win)
      return

    const overrideWidth = preview.overrideWidth.value
    // The wrapper becomes the named context while the authored element stays
    // below it, so a generated selector can legally target that element.
    restoreProperties(stored)
    const containerName = preview.containerName.value
    if (containerName) {
      element.style.setProperty('display', 'block', 'important')
      element.style.setProperty('container-type', 'inline-size', 'important')
      element.style.setProperty('container-name', containerName, 'important')
    }
    if (overrideWidth == null) {
      measure()
      return
    }

    const style = win.getComputedStyle(element)
    const inlineChrome = parsePixels(style.borderLeftWidth)
      + parsePixels(style.paddingLeft)
      + parsePixels(style.paddingRight)
      + parsePixels(style.borderRightWidth)
    const cssWidth = style.boxSizing === 'border-box'
      ? overrideWidth
      : Math.max(0, overrideWidth - inlineChrome)

    element.style.setProperty('width', `${cssWidth}px`, 'important')
    element.style.setProperty('min-width', '0px', 'important')
    element.style.setProperty('max-width', 'none', 'important')
    element.style.setProperty('flex', '0 0 auto', 'important')
    element.style.setProperty('margin-left', 'auto', 'important')
    element.style.setProperty('margin-right', 'auto', 'important')
    measure()
  }

  function setupTarget() {
    stopObserving()

    const element = targetElement()
    const context = contextElement()
    const win = iframeWin.value as (Window & typeof globalThis) | null
    if (!element || !context || !win) {
      preview.reportWidth(null)
      return
    }

    const properties = Object.fromEntries(PREVIEW_PROPERTIES.map(property => [
      property,
      {
        value: context.style.getPropertyValue(property),
        priority: context.style.getPropertyPriority(property),
      },
    ])) as Record<PreviewProperty, StoredProperty>
    storedStyles = { element, contextElement: context, properties }

    if (typeof win.ResizeObserver === 'function') {
      resizeObserver = new win.ResizeObserver(measure)
      resizeObserver.observe(element)
      if (context !== element)
        resizeObserver.observe(context)
    }

    applyOverride()
    measure()
  }

  watch(
    [
      () => preview.blockId.value,
      () => preview.containerName.value,
      iframeDoc,
      iframeWin,
      () => editor.documentRevision.value,
    ],
    () => void nextTick(setupTarget),
    { immediate: true, flush: 'post' },
  )

  watch(() => preview.overrideWidth.value, applyOverride)
  useEventListener(window, 'resize', measure)
  useEventListener(iframeWin, 'scroll', measure, { passive: true })

  onBeforeUnmount(() => {
    stopObserving()
    preview.reportWidth(null)
  })

  return {
    rect,
  }
}
