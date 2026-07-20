import type { Ref, ShallowRef } from 'vue'
import type { BlockStyles, GlobalSettings, PageBlock, PageDocument } from '@/core'
import {
  autoBlockClassName,
  createUniqueName,
  findBlock,
  isComboKey,
  mapDocumentBlocks,
  normalizeComboKey,
  parseClassKey,
  sanitizeClassName,
  updateBlockInTree,
} from '@/core'

export interface UseEditorClassesOptions {
  document: ShallowRef<PageDocument>
  globals: ShallowRef<GlobalSettings | null>
  effectiveDocument: Readonly<Ref<PageDocument>>
  updateBlock: (id: string, updater: (block: PageBlock) => PageBlock) => void
  commit: (document: PageDocument, label?: string, coalesce?: boolean) => void
  commitGlobals: (globals: GlobalSettings, label?: string, coalesce?: boolean) => void
  commitBoth: (document: PageDocument, globals: GlobalSettings, label?: string) => void
}

/**
 * Owns named CSS classes and keeps their references synchronized across page
 * blocks and component masters, regardless of where shared globals live.
 */
export function useEditorClasses(options: UseEditorClassesOptions) {
  const { document, globals, effectiveDocument, updateBlock, commit, commitGlobals, commitBoth } = options

  function activeStyles(): Record<string, BlockStyles> {
    return (globals.value ? globals.value.styles : document.value.styles) ?? {}
  }

  function docWithActiveSymbols(): PageDocument {
    return globals.value ? { ...document.value, symbols: globals.value.symbols } : document.value
  }

  function commitStyles(styles: Record<string, BlockStyles>, label = 'history.edit') {
    if (globals.value)
      commitGlobals({ ...globals.value, styles }, label)
    else
      commit({ ...document.value, styles }, label)
  }

  function ensureClassExists(name: string, withStyle?: BlockStyles): boolean {
    if (!name || isComboKey(name))
      return false
    const existing = activeStyles()
    if (existing[name])
      return true
    commitStyles({ ...existing, [name]: withStyle ? { ...withStyle } : {} })
    return true
  }

  function applyClassToBlock(blockId: string, className: string) {
    if (isComboKey(className))
      return
    ensureClassExists(className)
    updateBlock(blockId, (current) => {
      const next = current.classes ?? []
      if (next.includes(className))
        return current
      return { ...current, classes: [...next, className] }
    })
  }

  function removeClassFromBlock(blockId: string, className: string) {
    updateBlock(blockId, (current) => {
      const list = current.classes ?? []
      if (!list.includes(className))
        return current
      return { ...current, classes: list.filter(name => name !== className) }
    })
  }

  function uniqueClassName(base: string): string {
    const root = sanitizeClassName(base) || 'element'
    return createUniqueName(root, Object.keys(effectiveDocument.value.styles ?? {}))
  }

  function extractBlockStyleToClass(blockId: string, style: BlockStyles): string | null {
    const block = findBlock(document.value.blocks, blockId)
    if (!block)
      return null
    const name = uniqueClassName(autoBlockClassName(block))
    const styles = { ...activeStyles(), [name]: { ...style } }
    const nextBlocks = updateBlockInTree(document.value.blocks, blockId, current => ({
      ...current,
      classes: [...(current.classes ?? []), name],
      style: {},
    }))
    if (globals.value)
      commitBoth({ ...document.value, blocks: nextBlocks }, { ...globals.value, styles })
    else
      commit({ ...document.value, styles, blocks: nextBlocks })
    return name
  }

  function createClassFromBlock(blockId: string, className: string): boolean {
    const existing = activeStyles()
    if (!className || isComboKey(className) || existing[className])
      return false
    const block = findBlock(document.value.blocks, blockId)
    if (!block)
      return false
    const styles = { ...existing, [className]: { ...(block.style ?? {}) } }
    const nextBlocks = updateBlockInTree(document.value.blocks, blockId, current => ({
      ...current,
      classes: [...(current.classes ?? []), className],
      style: {},
    }))
    if (globals.value)
      commitBoth({ ...document.value, blocks: nextBlocks }, { ...globals.value, styles })
    else
      commit({ ...document.value, styles, blocks: nextBlocks })
    return true
  }

  function updateClassStyle(className: string, nextStyle: BlockStyles): boolean {
    const docStyles = document.value.styles ?? {}
    if (globals.value && docStyles[className]) {
      commit({ ...document.value, styles: { ...docStyles, [className]: { ...nextStyle } } })
      return true
    }
    commitStyles({ ...activeStyles(), [className]: { ...nextStyle } })
    return true
  }

  function createCombo(parts: string[]): string | null {
    const cleaned = Array.from(new Set(parts.filter(Boolean)))
    if (cleaned.length < 2)
      return null
    const existing = activeStyles()
    if (cleaned.some(part => !existing[part]))
      return null
    const key = normalizeComboKey(cleaned)
    if (existing[key])
      return key
    commitStyles({ ...existing, [key]: {} })
    return key
  }

  function renameClass(oldName: string, newName: string): boolean {
    if (!oldName || !newName || oldName === newName || isComboKey(oldName) || isComboKey(newName))
      return false
    const current = activeStyles()
    if (!current[oldName] || current[newName])
      return false

    const styles: Record<string, BlockStyles> = {}
    for (const [key, value] of Object.entries(current)) {
      const parts = parseClassKey(key)
      if (!parts.includes(oldName)) {
        styles[key] = value
        continue
      }
      const renamed = parts.map(part => part === oldName ? newName : part)
      const nextKey = isComboKey(key) ? normalizeComboKey(renamed) : renamed[0]!
      if (!styles[nextKey])
        styles[nextKey] = value
    }

    const mapped = mapDocumentBlocks(docWithActiveSymbols(), block => ({
      ...block,
      classes: block.classes?.map(name => name === oldName ? newName : name),
    }))
    if (globals.value)
      commitBoth({ ...document.value, blocks: mapped.blocks }, { ...globals.value, styles, symbols: mapped.symbols })
    else
      commit({ ...document.value, blocks: mapped.blocks, symbols: mapped.symbols, styles })
    return true
  }

  function deleteClass(className: string): boolean {
    const current = activeStyles()
    if (!current[className])
      return false
    const styles: Record<string, BlockStyles> = {}
    for (const [key, value] of Object.entries(current)) {
      if (key === className || parseClassKey(key).includes(className))
        continue
      styles[key] = value
    }

    const mapped = mapDocumentBlocks(docWithActiveSymbols(), block => ({
      ...block,
      classes: block.classes?.filter(name => name !== className),
    }))
    if (globals.value)
      commitBoth({ ...document.value, blocks: mapped.blocks }, { ...globals.value, styles, symbols: mapped.symbols })
    else
      commit({ ...document.value, blocks: mapped.blocks, symbols: mapped.symbols, styles })
    return true
  }

  return {
    ensureClassExists,
    applyClassToBlock,
    removeClassFromBlock,
    extractBlockStyleToClass,
    createClassFromBlock,
    updateClassStyle,
    createCombo,
    renameClass,
    deleteClass,
  }
}
