import type { InjectionKey, Ref } from 'vue'
import { inject } from 'vue'

/**
 * Teleport target for every floating layer (Popover / Dialog / Select /
 * Dropdown / Tooltip). The editor shell provides its `.uf-editor` root so
 * portaled content stays inside the scoped style reset (`@layer reset` only
 * covers `.uf-editor *`) and never lands in a host page's DOM — the editor is
 * embeddable, and dropping overlays into a foreign <body> lets the host's CSS
 * bleed into them. Without a provider (stories, isolated component use) the
 * portals keep reka-ui's default target, <body>.
 */
export const UI_PORTAL_TARGET: InjectionKey<Ref<HTMLElement | null>> = Symbol('uf-ui-portal-target')

export function usePortalTarget(): Ref<HTMLElement | null> | undefined {
  return inject(UI_PORTAL_TARGET, undefined)
}
