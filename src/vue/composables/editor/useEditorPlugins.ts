import type { BlockRegistry, UframePlugin } from '@/core'
import { computed, shallowRef } from 'vue'
import { defaultBlockDefinitions } from '@/blocks'
import { applyPlugins } from '@/core'

export interface UseEditorPluginsOptions {
  blocks?: BlockRegistry
  plugins?: UframePlugin[]
}

/** Owns the live block registry and runtime plugin registration. */
export function useEditorPlugins(options: UseEditorPluginsOptions = {}) {
  const registeredPlugins = shallowRef<UframePlugin[]>(options.plugins ?? [])
  const registry = shallowRef<BlockRegistry>(
    applyPlugins(
      options.blocks ?? Object.fromEntries(defaultBlockDefinitions.map(definition => [definition.type, definition])),
      registeredPlugins.value,
    ),
  )
  const blockDefinitions = computed(() => Object.values(registry.value))

  function registerPlugins(plugins: UframePlugin[]) {
    if (!plugins.length)
      return
    registeredPlugins.value = [...registeredPlugins.value, ...plugins]
    registry.value = applyPlugins(registry.value, plugins)
  }

  async function loadPlugins(urls: string[]) {
    for (const url of urls) {
      const mod = await import(/* @vite-ignore */ url) as { default?: UframePlugin } & UframePlugin
      const plugin = mod.default ?? mod
      if (plugin?.name)
        registerPlugins([plugin])
    }
  }

  return { registry, registeredPlugins, blockDefinitions, registerPlugins, loadPlugins }
}
