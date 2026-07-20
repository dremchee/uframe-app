import type { BlockRegistry } from '@/core'
import { describe, expect, it } from 'vitest'
import { effectScope } from 'vue'
import { z } from 'zod'
import { createBlockRegistry, createGlobalSettings, createPageDocument, findBlock } from '@/core'
import { usePageEditor } from '@/vue/composables/editor/usePageEditor'

function makeRegistry(): BlockRegistry {
  return createBlockRegistry([
    {
      type: 'heading',
      label: 'Heading',
      defaultProps: { content: 'Title' },
      propsSchema: z.object({ content: z.string() }),
      renderComponent: {},
    },
    {
      type: 'container',
      label: 'Container',
      defaultProps: {},
      propsSchema: z.object({}),
      renderComponent: {},
      acceptsChildren: true,
    },
    {
      type: 'div',
      label: 'Div',
      defaultProps: {},
      propsSchema: z.object({}),
      renderComponent: {},
      acceptsChildren: true,
    },
    {
      type: 'button',
      label: 'Button',
      defaultProps: { label: 'Open link', href: '#', disabled: false },
      propsSchema: z.object({ label: z.string(), href: z.string(), disabled: z.boolean() }),
      renderComponent: {},
    },
    {
      type: 'slot',
      label: 'Slot',
      availability: 'component',
      defaultProps: { name: 'content' },
      propsSchema: z.object({ name: z.string() }),
      renderComponent: {},
      acceptsChildren: true,
    },
  ])
}

function withEditor<T>(run: (editor: ReturnType<typeof usePageEditor>) => T): T {
  const scope = effectScope()
  try {
    return scope.run(() => {
      const editor = usePageEditor({
        document: createPageDocument({ title: 'T' }),
        blocks: makeRegistry(),
      })
      return run(editor)
    }) as T
  }
  finally {
    scope.stop()
  }
}

// Same, but with a shared globals context handed in (opt-in global settings).
function withGlobalsEditor<T>(run: (editor: ReturnType<typeof usePageEditor>) => T, globals = createGlobalSettings()): T {
  const scope = effectScope()
  try {
    return scope.run(() => run(usePageEditor({
      document: createPageDocument({ title: 'T' }),
      globals,
      blocks: makeRegistry(),
    }))) as T
  }
  finally {
    scope.stop()
  }
}

describe('usePageEditor', () => {
  it('starts with the provided document', () => {
    withEditor((editor) => {
      expect(editor.document.value.title).toBe('T')
      expect(editor.document.value.blocks).toEqual([])
    })
  })

  it('addBlock appends to the root when nothing is selected', () => {
    withEditor((editor) => {
      editor.addBlock('heading')
      expect(editor.document.value.blocks).toHaveLength(1)
      expect(editor.document.value.blocks[0]?.type).toBe('heading')
      expect(editor.selectedBlockId.value).toBe(editor.document.value.blocks[0]?.id)
    })
  })

  it('addBlock nests inside selected container when it acceptsChildren', () => {
    withEditor((editor) => {
      editor.addBlock('container')
      const containerId = editor.selectedBlockId.value!
      editor.addBlock('heading')
      const container = findBlock(editor.document.value.blocks, containerId)
      expect(container?.children?.map(c => c.type)).toEqual(['heading'])
    })
  })

  it('insertBlock places a new block at the requested index', () => {
    withEditor((editor) => {
      editor.addBlock('heading')
      editor.addBlock('heading')
      editor.insertBlock('heading', null, 1)
      expect(editor.document.value.blocks).toHaveLength(3)
    })
  })

  it('moveBlockTo reorders existing blocks', () => {
    withEditor((editor) => {
      editor.addBlock('heading')
      const first = editor.selectedBlockId.value!
      editor.addBlock('heading')
      const second = editor.selectedBlockId.value!

      editor.moveBlockTo(first, null, 2)
      expect(editor.document.value.blocks.map(b => b.id)).toEqual([second, first])
    })
  })

  it('replaceBlockProps validates against the block schema', () => {
    withEditor((editor) => {
      editor.addBlock('heading')
      const id = editor.selectedBlockId.value!
      const ok = editor.replaceBlockProps(id, { content: 'New' })
      expect(ok).toBe(true)
      expect(findBlock(editor.document.value.blocks, id)?.props).toEqual({ content: 'New' })

      const bad = editor.replaceBlockProps(id, { content: 42 } as never)
      expect(bad).toBe(false)
      expect(editor.errors.value.length).toBeGreaterThan(0)
    })
  })

  it('sets and clears a user-defined block name', () => {
    withEditor((editor) => {
      editor.addBlock('heading')
      const id = editor.selectedBlockId.value!

      expect(editor.setBlockName(id, ' Hero title ')).toBe(true)
      expect(findBlock(editor.document.value.blocks, id)?.name).toBe('Hero title')

      expect(editor.setBlockName(id, '   ')).toBe(true)
      expect(findBlock(editor.document.value.blocks, id)?.name).toBeUndefined()
    })
  })

  it('createClass + applyClass + updateClassStyle update the registry', () => {
    withEditor((editor) => {
      editor.addBlock('heading')
      const id = editor.selectedBlockId.value!
      editor.updateBlockStyle(id, { color: '#000' })

      expect(editor.createClass(id, 'primary')).toBe(true)
      expect(editor.document.value.styles?.primary).toEqual({ color: '#000' })
      // block.style is reset after lifting into the class
      expect(findBlock(editor.document.value.blocks, id)?.style).toEqual({})
      // class is applied
      expect(findBlock(editor.document.value.blocks, id)?.classes).toEqual(['primary'])

      // Second block applies the existing class
      editor.addBlock('heading')
      const other = editor.selectedBlockId.value!
      editor.applyClass(other, 'primary')
      expect(findBlock(editor.document.value.blocks, other)?.classes).toEqual(['primary'])

      // Updating the class flows everywhere via serializeDocumentStyles
      editor.updateClassStyle('primary', { color: '#111' })
      expect(editor.document.value.styles?.primary).toEqual({ color: '#111' })
    })
  })

  it('removeClass strips the name from a block', () => {
    withEditor((editor) => {
      editor.addBlock('heading')
      const id = editor.selectedBlockId.value!
      editor.applyClass(id, 'primary')
      editor.removeClass(id, 'primary')
      expect(findBlock(editor.document.value.blocks, id)?.classes).toEqual([])
    })
  })

  it('createCombo requires every part to already exist as a class', () => {
    withEditor((editor) => {
      editor.addBlock('heading')
      const id = editor.selectedBlockId.value!
      editor.applyClass(id, 'button')

      // primary doesn't exist yet — combo must be rejected.
      expect(editor.createCombo(['button', 'primary'])).toBeNull()

      editor.applyClass(id, 'primary')
      const key = editor.createCombo(['primary', 'button'])
      // normalised, sorted, joined with dots
      expect(key).toBe('button.primary')
      expect(editor.document.value.styles?.[key!]).toEqual({})
    })
  })

  it('createCombo is idempotent — second call returns the same key', () => {
    withEditor((editor) => {
      editor.addBlock('heading')
      const id = editor.selectedBlockId.value!
      editor.applyClass(id, 'a')
      editor.applyClass(id, 'b')

      const first = editor.createCombo(['a', 'b'])
      editor.updateClassStyle(first!, { color: '#f00' })
      const second = editor.createCombo(['b', 'a'])
      expect(second).toBe(first)
      // style preserved (combo wasn't overwritten)
      expect(editor.document.value.styles?.[first!]).toEqual({ color: '#f00' })
    })
  })

  it('createCombo rejects fewer than 2 parts', () => {
    withEditor((editor) => {
      editor.addBlock('heading')
      const id = editor.selectedBlockId.value!
      editor.applyClass(id, 'solo')
      expect(editor.createCombo(['solo'])).toBeNull()
      expect(editor.createCombo([])).toBeNull()
    })
  })

  it('applyClass and createClass reject combo-like names', () => {
    withEditor((editor) => {
      editor.addBlock('heading')
      const id = editor.selectedBlockId.value!
      editor.applyClass(id, 'a.b')
      // dot-bearing name must not slip in as a single class
      expect(editor.document.value.styles?.['a.b']).toBeUndefined()
      expect(findBlock(editor.document.value.blocks, id)?.classes ?? []).not.toContain('a.b')

      expect(editor.createClass(id, 'foo.bar')).toBe(false)
    })
  })

  it('deleteClass removes combos that referenced the class', () => {
    withEditor((editor) => {
      editor.addBlock('heading')
      const id = editor.selectedBlockId.value!
      editor.applyClass(id, 'a')
      editor.applyClass(id, 'b')
      editor.applyClass(id, 'c')
      editor.createCombo(['a', 'b'])
      editor.createCombo(['a', 'c'])
      editor.createCombo(['b', 'c'])

      editor.deleteClass('a')
      const styles = editor.document.value.styles ?? {}
      expect(styles.a).toBeUndefined()
      expect(styles['a.b']).toBeUndefined()
      expect(styles['a.c']).toBeUndefined()
      // unrelated combo survives
      expect(styles['b.c']).toEqual({})
      expect(findBlock(editor.document.value.blocks, id)?.classes).toEqual(['b', 'c'])
    })
  })

  it('renameClass updates combo keys that referenced the old name', () => {
    withEditor((editor) => {
      editor.addBlock('heading')
      const id = editor.selectedBlockId.value!
      editor.applyClass(id, 'button')
      editor.applyClass(id, 'primary')
      editor.createCombo(['button', 'primary'])
      editor.updateClassStyle('button.primary', { color: '#0f0' })

      expect(editor.renameClass('button', 'btn')).toBe(true)
      const styles = editor.document.value.styles ?? {}
      expect(styles.button).toBeUndefined()
      expect(styles['button.primary']).toBeUndefined()
      // normalised → still alphabetically sorted
      expect(styles['btn.primary']).toEqual({ color: '#0f0' })
    })
  })

  it('renameClass rejects renames that would create combo collisions on parts', () => {
    withEditor((editor) => {
      editor.addBlock('heading')
      const id = editor.selectedBlockId.value!
      editor.applyClass(id, 'a')
      // Renames into combo names are not allowed (dots are reserved).
      expect(editor.renameClass('a', 'a.b')).toBe(false)
    })
  })

  describe('tree operations (wrap / unwrap / hide)', () => {
    it('wrapBlock replaces the block with a div wrapper containing it', () => {
      withEditor((editor) => {
        editor.insertBlock('heading', null, 0)
        const heading = editor.document.value.blocks[0]!
        expect(editor.wrapBlock(heading.id)).toBe(true)
        const wrapper = editor.document.value.blocks[0]!
        expect(wrapper.type).toBe('div')
        expect(wrapper.children?.map(b => b.id)).toEqual([heading.id])
        expect(editor.selectedBlockId.value).toBe(wrapper.id)
      })
    })

    it('unwrapBlock replaces the wrapper with its children in place', () => {
      withEditor((editor) => {
        editor.insertBlock('container', null, 0)
        const container = editor.document.value.blocks[0]!
        editor.insertBlock('heading', container.id, 0)
        editor.insertBlock('heading', container.id, 1)
        const childIds = findBlock(editor.document.value.blocks, container.id)!.children!.map(b => b.id)
        expect(editor.unwrapBlock(container.id)).toBe(true)
        expect(editor.document.value.blocks.map(b => b.id)).toEqual(childIds)
        expect(editor.selectedBlockId.value).toBe(childIds[0])
      })
    })

    it('unwrapBlock no-ops for a block without children', () => {
      withEditor((editor) => {
        editor.insertBlock('heading', null, 0)
        const id = editor.document.value.blocks[0]!.id
        expect(editor.unwrapBlock(id)).toBe(false)
        expect(editor.document.value.blocks[0]!.id).toBe(id)
      })
    })

    it('setBlockHidden toggles the top-level flag without touching styles', () => {
      withEditor((editor) => {
        editor.insertBlock('heading', null, 0)
        const id = editor.document.value.blocks[0]!.id
        editor.updateBlockStyle(id, { color: '#f00' })

        expect(editor.setBlockHidden(id, true)).toBe(true)
        let block = findBlock(editor.document.value.blocks, id)
        expect(block?.hidden).toBe(true)
        expect(block?.style).toEqual({ color: '#f00' })

        editor.setBlockHidden(id, false)
        block = findBlock(editor.document.value.blocks, id)
        expect(block?.hidden).toBeUndefined()
        expect(block?.style).toEqual({ color: '#f00' })
      })
    })
  })

  describe('symbols (user-created components)', () => {
    it('saveBlockAsSymbol moves the subtree into document.symbols and replaces with an instance', () => {
      withEditor((editor) => {
        editor.addBlock('container')
        const containerId = editor.selectedBlockId.value!
        editor.addBlock('heading')
        const headingId = editor.selectedBlockId.value!

        const symbolId = editor.saveBlockAsSymbol(containerId, 'Card')
        expect(symbolId).toBeTruthy()

        // Original container is gone, replaced by an instance block.
        expect(findBlock(editor.document.value.blocks, containerId)).toBeUndefined()
        const root = editor.document.value.blocks[0]
        expect(root?.type).toBe('__symbol')
        expect((root?.props as { symbolId: string }).symbolId).toBe(symbolId)
        expect(editor.selectedBlockId.value).toBe(root?.id)

        // Master tree retained the original block ids.
        const master = editor.document.value.symbols![symbolId as string]
        expect(master.root.id).toBe(containerId)
        expect(master.root.children?.[0]?.id).toBe(headingId)
      })
    })

    it('addSymbolInstance and insertSymbolInstance both work and reuse the same master', () => {
      withEditor((editor) => {
        editor.addBlock('container')
        const symbolId = editor.saveBlockAsSymbol(editor.selectedBlockId.value!, 'Card') as string

        editor.addSymbolInstance(symbolId)
        editor.insertSymbolInstance(symbolId, null, 0)
        expect(editor.document.value.blocks).toHaveLength(3)
        // All three are instances of the same symbol.
        const symbolIds = editor.document.value.blocks
          .map(b => (b.props as { symbolId?: string }).symbolId)
        expect(symbolIds).toEqual([symbolId, symbolId, symbolId])
      })
    })

    it('saveBlockAsSymbol refuses to re-symbol an instance', () => {
      withEditor((editor) => {
        editor.addBlock('container')
        const symbolId = editor.saveBlockAsSymbol(editor.selectedBlockId.value!, 'Card') as string
        const instanceId = editor.selectedBlockId.value!
        expect(editor.saveBlockAsSymbol(instanceId, 'NestedCard')).toBe(false)
        // Symbols registry is unchanged.
        expect(Object.keys(editor.document.value.symbols!)).toEqual([symbolId])
      })
    })

    it('deleteSymbol removes the master AND every instance, including nested ones', () => {
      withEditor((editor) => {
        // Symbol A
        editor.addBlock('container')
        const symA = editor.saveBlockAsSymbol(editor.selectedBlockId.value!, 'A') as string

        // Symbol B contains an instance of A
        editor.addBlock('container')
        const bRoot = editor.selectedBlockId.value!
        editor.insertSymbolInstance(symA, bRoot, 0)
        const symB = editor.saveBlockAsSymbol(bRoot, 'B') as string

        // Page has: instance of A (left over from saving A), instance of B
        // (left over from saving B), and a fresh instance of A appended.
        editor.addSymbolInstance(symA)
        expect(editor.document.value.blocks).toHaveLength(3)

        editor.deleteSymbol(symA)

        // Master A is gone.
        expect(editor.document.value.symbols![symA]).toBeUndefined()
        // Page-level instances of A are gone too.
        expect(editor.document.value.blocks.every(b =>
          (b.props as { symbolId?: string }).symbolId !== symA,
        )).toBe(true)
        // The nested A inside B's master is also gone.
        const masterB = editor.document.value.symbols![symB]
        expect(masterB?.root.children?.some(c => c.type === '__symbol')).toBe(false)
      })
    })

    it('deleteSymbol clears selection when the deleted instance was selected', () => {
      withEditor((editor) => {
        editor.addBlock('container')
        const symbolId = editor.saveBlockAsSymbol(editor.selectedBlockId.value!, 'Card') as string
        const instanceId = editor.selectedBlockId.value!

        editor.deleteSymbol(symbolId)
        expect(editor.selectedBlockId.value).not.toBe(instanceId)
      })
    })

    it('renameClass updates class references inside symbol masters too', () => {
      withEditor((editor) => {
        editor.addBlock('container')
        const id = editor.selectedBlockId.value!
        editor.updateBlockStyle(id, { color: '#000' })
        editor.createClass(id, 'card')

        const symbolId = editor.saveBlockAsSymbol(id, 'Card') as string
        editor.renameClass('card', 'panel')

        const master = editor.document.value.symbols![symbolId]
        expect(master.root.classes).toEqual(['panel'])
      })
    })

    it('saving a block as symbol seeds a Default variant', () => {
      withEditor((editor) => {
        editor.addBlock('container')
        const symbolId = editor.saveBlockAsSymbol(editor.selectedBlockId.value!, 'Card') as string
        const symbol = editor.document.value.symbols![symbolId]
        expect(symbol.variants.map(v => v.name)).toEqual(['Default'])
        expect(symbol.defaultVariantId).toBe(symbol.variants![0]!.id)
      })
    })

    it('variants: create, set active, render via class composition', () => {
      withEditor((editor) => {
        editor.addBlock('container')
        const symbolId = editor.saveBlockAsSymbol(editor.selectedBlockId.value!, 'Card') as string
        const instanceId = editor.selectedBlockId.value!

        const variantId = editor.createSymbolVariant(symbolId, 'Compact') as string
        editor.setSymbolVariantClasses(symbolId, variantId, ['compact'])
        editor.setInstanceVariant(instanceId, variantId)

        // Persisted on the instance.
        const inst = findBlock(editor.document.value.blocks, instanceId)!
        expect((inst.props as { variantId: string }).variantId).toBe(variantId)

        // Variant payload landed on the symbol.
        const sym = editor.document.value.symbols![symbolId]
        const compact = sym.variants!.find(v => v.id === variantId)!
        expect(compact.classes).toEqual(['compact'])
        // ensureClass auto-created an empty entry in document.styles.
        expect(editor.document.value.styles?.compact).toEqual({})
      })
    })

    it('deleting a variant clears it from instances that referenced it', () => {
      withEditor((editor) => {
        editor.addBlock('container')
        const symbolId = editor.saveBlockAsSymbol(editor.selectedBlockId.value!, 'Card') as string
        const instanceId = editor.selectedBlockId.value!

        const variantId = editor.createSymbolVariant(symbolId, 'Compact') as string
        editor.setInstanceVariant(instanceId, variantId)
        editor.deleteSymbolVariant(symbolId, variantId)

        const inst = findBlock(editor.document.value.blocks, instanceId)!
        expect((inst.props as { variantId?: string }).variantId).toBeUndefined()
      })
    })

    it('deleteSymbolVariant refuses to delete the last variant', () => {
      withEditor((editor) => {
        editor.addBlock('container')
        const symbolId = editor.saveBlockAsSymbol(editor.selectedBlockId.value!, 'Card') as string
        const onlyVariantId = editor.document.value.symbols![symbolId].variants![0]!.id
        expect(editor.deleteSymbolVariant(symbolId, onlyVariantId)).toBe(false)
      })
    })

    it('detachSymbolInstance replaces the instance with a deep-cloned tree (fresh IDs)', () => {
      withEditor((editor) => {
        editor.addBlock('container')
        const containerId = editor.selectedBlockId.value!
        editor.addBlock('heading')
        const headingId = editor.selectedBlockId.value!

        const symbolId = editor.saveBlockAsSymbol(containerId, 'Card') as string
        const instanceId = editor.selectedBlockId.value!
        editor.detachSymbolInstance(instanceId)

        // Instance gone, replaced by a clone.
        expect(editor.document.value.blocks[0]?.type).toBe('container')
        // IDs differ from the master.
        expect(editor.document.value.blocks[0]?.id).not.toBe(containerId)
        expect(editor.document.value.blocks[0]?.children?.[0]?.id).not.toBe(headingId)
        // Master untouched.
        const master = editor.document.value.symbols![symbolId]
        expect(master.root.id).toBe(containerId)
        expect(master.root.children?.[0]?.id).toBe(headingId)
      })
    })

    it('deleteClass strips class references inside symbol masters too', () => {
      withEditor((editor) => {
        editor.addBlock('container')
        const id = editor.selectedBlockId.value!
        editor.updateBlockStyle(id, { color: '#000' })
        editor.createClass(id, 'card')

        const symbolId = editor.saveBlockAsSymbol(id, 'Card') as string
        editor.deleteClass('card')

        const master = editor.document.value.symbols![symbolId]
        expect(master.root.classes ?? []).toEqual([])
      })
    })

    it('creates named Slots only while editing a component master', () => {
      withEditor((editor) => {
        expect(editor.addBlock('slot')).toBe(false)

        editor.addBlock('container')
        const symbolId = editor.saveBlockAsSymbol(editor.selectedBlockId.value!, 'Card') as string
        const instanceId = editor.selectedBlockId.value!
        expect(editor.enterSymbolEdit(symbolId, instanceId)).toBe(true)

        const rootId = editor.editScopeRootId.value!
        expect(editor.addBlock('slot', rootId)).toBe(false)
        expect(editor.insertBlock('slot', rootId, 0)).toBe(false)
        const first = editor.addComponentSlot(rootId)
        const second = editor.addComponentSlot(rootId)
        expect(first).toBeTruthy()
        expect(second).toBeTruthy()
        expect(editor.duplicateBlock(first as string)).toBe(false)
        expect(editor.replaceBlockProps(second as string, { name: 'content' })).toBe(false)
        expect(findBlock(editor.document.value.blocks, first as string)?.props.name).toBe('content')
        expect(findBlock(editor.document.value.blocks, second as string)?.props.name).toBe('content-2')

        editor.exitSymbolEdit()
        expect(editor.document.value.symbols![symbolId].root.children?.filter(child => child.type === 'slot')).toHaveLength(2)
      })
    })

    it('resets instance Slot content to the master fallback', () => {
      withEditor((editor) => {
        editor.addBlock('container')
        const symbolId = editor.saveBlockAsSymbol(editor.selectedBlockId.value!, 'Card') as string
        const instanceId = editor.selectedBlockId.value!
        editor.enterSymbolEdit(symbolId, instanceId)
        const slotId = editor.addComponentSlot(editor.editScopeRootId.value!) as string
        editor.addBlock('heading', slotId)
        const fallbackId = editor.selectedBlockId.value!
        editor.exitSymbolEdit()

        // The first insert into a fallback Slot creates the fill, cloning the
        // fallback content so the instance keeps rendering what it showed.
        expect(editor.insertBlockIntoInstanceSlot(instanceId, slotId, 'button')).toBe(true)
        let instance = findBlock(editor.document.value.blocks, instanceId)!
        let fill = instance.children?.find(child => child.type === '__symbol_slot_fill')
        expect(fill?.children?.map(child => child.type)).toEqual(['heading', 'button'])
        expect(fill?.children?.[0]?.id).not.toBe(fallbackId)
        expect(editor.duplicateBlock(fill!.id)).toBe(false)
        expect(editor.moveBlockTo(fill!.id, null, 0)).toBe(false)

        // Emptying an override happens by deleting its blocks directly — the
        // fill node stays behind, so the Slot renders empty (not the fallback).
        for (const child of [...(fill?.children ?? [])])
          editor.removeBlock(child.id)
        instance = findBlock(editor.document.value.blocks, instanceId)!
        fill = instance.children?.find(child => child.type === '__symbol_slot_fill')
        expect(fill?.children).toEqual([])

        expect(editor.resetInstanceSlot(instanceId, slotId)).toBe(true)
        instance = findBlock(editor.document.value.blocks, instanceId)!
        expect(instance.children).toEqual([])
      })
    })

    it('inserts a library block into fallback, custom and empty Slot states atomically', () => {
      withEditor((editor) => {
        editor.addBlock('container')
        const symbolId = editor.saveBlockAsSymbol(editor.selectedBlockId.value!, 'Card') as string
        const instanceId = editor.selectedBlockId.value!
        editor.enterSymbolEdit(symbolId, instanceId)
        const slotId = editor.addComponentSlot(editor.editScopeRootId.value!) as string
        editor.addBlock('heading', slotId)
        const fallbackId = editor.selectedBlockId.value!
        editor.exitSymbolEdit()

        const historySize = editor.historyEntries.value.length
        expect(editor.insertBlockIntoInstanceSlot(instanceId, slotId, 'heading')).toBe(true)
        let fill = findBlock(editor.document.value.blocks, instanceId)?.children?.[0]
        expect(fill?.children?.map(child => child.type)).toEqual(['heading', 'heading'])
        expect(fill?.children?.[0]?.id).not.toBe(fallbackId)
        expect(editor.historyEntries.value).toHaveLength(historySize + 1)

        editor.undo()
        expect(findBlock(editor.document.value.blocks, instanceId)?.children ?? []).toEqual([])
        editor.redo()

        expect(editor.insertBlockIntoInstanceSlot(instanceId, slotId, 'heading')).toBe(true)
        fill = findBlock(editor.document.value.blocks, instanceId)?.children?.[0]
        expect(fill?.children).toHaveLength(3)

        for (const child of [...(fill?.children ?? [])])
          editor.removeBlock(child.id)
        expect(editor.insertBlockIntoInstanceSlot(instanceId, slotId, 'heading')).toBe(true)
        fill = findBlock(editor.document.value.blocks, instanceId)?.children?.[0]
        expect(fill?.children?.map(child => child.type)).toEqual(['heading'])
        expect(editor.insertBlockIntoInstanceSlot(instanceId, slotId, 'slot')).toBe(false)
      })
    })

    it('inserts a symbol instance into a Slot', () => {
      withEditor((editor) => {
        editor.addBlock('container')
        const cardId = editor.saveBlockAsSymbol(editor.selectedBlockId.value!, 'Card') as string
        const cardInstanceId = editor.selectedBlockId.value!
        editor.enterSymbolEdit(cardId, cardInstanceId)
        const slotId = editor.addComponentSlot(editor.editScopeRootId.value!) as string
        editor.exitSymbolEdit()

        editor.addBlock('container')
        const badgeId = editor.saveBlockAsSymbol(editor.selectedBlockId.value!, 'Badge') as string

        expect(editor.insertSymbolIntoInstanceSlot(cardInstanceId, slotId, badgeId)).toBe(true)
        const fill = findBlock(editor.document.value.blocks, cardInstanceId)?.children?.[0]
        expect(fill?.children).toHaveLength(1)
        expect(fill?.children?.[0]?.type).toBe('__symbol')
        expect((fill?.children?.[0]?.props as { symbolId?: string }).symbolId).toBe(badgeId)
        expect(editor.insertSymbolIntoInstanceSlot(cardInstanceId, slotId, 'missing')).toBe(false)
        expect(editor.insertSymbolIntoInstanceSlot(cardInstanceId, slotId, cardId)).toBe(false)

        editor.addBlock('container')
        const wrapperRootId = editor.selectedBlockId.value!
        editor.addSymbolInstance(cardId)
        const wrapperId = editor.saveBlockAsSymbol(wrapperRootId, 'Wrapper') as string
        expect(editor.insertSymbolIntoInstanceSlot(cardInstanceId, slotId, wrapperId)).toBe(false)
      })
    })

    it('moves an existing block into a Slot without a separate customize step', () => {
      withEditor((editor) => {
        editor.addBlock('container')
        const symbolId = editor.saveBlockAsSymbol(editor.selectedBlockId.value!, 'Card') as string
        const instanceId = editor.selectedBlockId.value!
        editor.enterSymbolEdit(symbolId, instanceId)
        const slotId = editor.addComponentSlot(editor.editScopeRootId.value!) as string
        editor.addBlock('heading', slotId)
        editor.exitSymbolEdit()

        editor.addBlock('heading')
        const sourceId = editor.selectedBlockId.value!
        const blocksBefore = editor.document.value.blocks
        const historySize = editor.historyEntries.value.length

        expect(editor.moveBlockIntoInstanceSlot(instanceId, slotId, sourceId)).toBe(true)
        const fill = findBlock(editor.document.value.blocks, instanceId)?.children?.[0]
        expect(fill?.children?.map(child => child.id)).toContain(sourceId)
        expect(editor.document.value.blocks).toHaveLength(1)
        expect(editor.historyEntries.value).toHaveLength(historySize + 1)

        editor.undo()
        expect(editor.document.value.blocks).toBe(blocksBefore)
        expect(findBlock(editor.document.value.blocks, instanceId)?.children ?? []).toEqual([])

        const invalidHistorySize = editor.historyEntries.value.length
        expect(editor.moveBlockIntoInstanceSlot(instanceId, slotId, instanceId)).toBe(false)
        expect(editor.moveBlockIntoInstanceSlot(instanceId, 'missing', sourceId)).toBe(false)
        expect(editor.moveBlockIntoInstanceSlot('missing', slotId, sourceId)).toBe(false)
        expect(editor.historyEntries.value).toHaveLength(invalidHistorySize)
        editor.addSymbolInstance(symbolId)
        const secondInstanceId = editor.selectedBlockId.value!
        const cycleHistorySize = editor.historyEntries.value.length
        expect(editor.moveBlockIntoInstanceSlot(instanceId, slotId, secondInstanceId)).toBe(false)
        expect(editor.historyEntries.value).toHaveLength(cycleHistorySize)
      })
    })

    it('tracks repeated selection intent even when the block id does not change', () => {
      withEditor((editor) => {
        editor.addBlock('heading')
        const id = editor.selectedBlockId.value!
        const initial = editor.selectionIntentNonce.value

        editor.selectBlock(id)
        editor.selectBlock(id)
        editor.selectBlockInstance(id)

        expect(editor.selectionIntentNonce.value).toBe(initial + 3)
      })
    })

    it('adds library blocks and components after the selected non-container block', () => {
      withEditor((editor) => {
        editor.addBlock('container')
        const containerId = editor.selectedBlockId.value!
        editor.addBlock('heading')
        const firstHeadingId = editor.selectedBlockId.value!
        editor.addBlock('heading')
        const secondHeadingId = editor.selectedBlockId.value!
        const container = findBlock(editor.document.value.blocks, containerId)!
        expect(container.children?.map(child => child.id)).toEqual([firstHeadingId, secondHeadingId])

        // Re-select the FIRST heading: the next add lands right after it,
        // not at the end of the container (and never at the page end).
        editor.selectBlock(firstHeadingId)
        expect(editor.addBlock('button')).toBe(true)
        const buttonId = editor.selectedBlockId.value!
        expect(findBlock(editor.document.value.blocks, containerId)?.children?.map(child => child.id))
          .toEqual([firstHeadingId, buttonId, secondHeadingId])

        // Components follow the same rule. (The badge source is created at the
        // page level explicitly — a default add would land next to the button.)
        editor.addBlock('container', null)
        const badgeSourceId = editor.selectedBlockId.value!
        const badgeId = editor.saveBlockAsSymbol(badgeSourceId, 'Badge') as string
        editor.selectBlock(firstHeadingId)
        expect(editor.addSymbolInstance(badgeId)).toBe(true)
        const instanceId = editor.selectedBlockId.value!
        expect(findBlock(editor.document.value.blocks, containerId)?.children?.map(child => child.id))
          .toEqual([firstHeadingId, instanceId, buttonId, secondHeadingId])

        // No selection → unchanged behaviour: append to the page end.
        editor.selectBlock(null)
        expect(editor.addBlock('heading')).toBe(true)
        const tailId = editor.selectedBlockId.value!
        expect(editor.document.value.blocks.at(-1)?.id).toBe(tailId)
      })
    })

    it('uses a selected valid Slot fill as the default add parent', () => {
      withEditor((editor) => {
        editor.addBlock('container')
        const symbolId = editor.saveBlockAsSymbol(editor.selectedBlockId.value!, 'Card') as string
        const instanceId = editor.selectedBlockId.value!
        editor.enterSymbolEdit(symbolId, instanceId)
        const slotId = editor.addComponentSlot(editor.editScopeRootId.value!) as string
        editor.exitSymbolEdit()
        editor.insertBlockIntoInstanceSlot(instanceId, slotId, 'button')

        const fillId = findBlock(editor.document.value.blocks, instanceId)?.children?.[0]?.id as string
        editor.selectBlock(fillId)
        expect(editor.addBlock('heading')).toBe(true)
        expect(findBlock(editor.document.value.blocks, fillId)?.children?.map(child => child.type)).toEqual(['button', 'heading'])
      })
    })

    it('detaches the materialized Slot content as an ordinary div', () => {
      withEditor((editor) => {
        editor.addBlock('container')
        const symbolId = editor.saveBlockAsSymbol(editor.selectedBlockId.value!, 'Card') as string
        const instanceId = editor.selectedBlockId.value!
        editor.enterSymbolEdit(symbolId, instanceId)
        const slotId = editor.addComponentSlot(editor.editScopeRootId.value!) as string
        editor.addBlock('heading', slotId)
        editor.exitSymbolEdit()

        editor.insertBlockIntoInstanceSlot(instanceId, slotId, 'button')
        editor.detachSymbolInstance(instanceId)
        const detached = editor.document.value.blocks[0]!
        expect(detached.type).toBe('container')
        expect(detached.children?.[0]?.type).toBe('div')
        expect(detached.children?.[0]?.children?.map(child => child.type)).toEqual(['heading', 'button'])
      })
    })

    it('removes instance fills when their master Slot is deleted', () => {
      withEditor((editor) => {
        editor.addBlock('container')
        const symbolId = editor.saveBlockAsSymbol(editor.selectedBlockId.value!, 'Card') as string
        const instanceId = editor.selectedBlockId.value!
        editor.enterSymbolEdit(symbolId, instanceId)
        const slotId = editor.addComponentSlot(editor.editScopeRootId.value!) as string
        editor.exitSymbolEdit()
        editor.insertBlockIntoInstanceSlot(instanceId, slotId, 'heading')

        editor.enterSymbolEdit(symbolId, instanceId)
        editor.removeBlock(slotId)
        editor.exitSymbolEdit()

        expect(findBlock(editor.document.value.blocks, instanceId)?.children).toEqual([])
      })
    })

    it('renames a component property label, keeping its key stable', () => {
      withEditor((editor) => {
        editor.addBlock('button')
        const targetId = editor.selectedBlockId.value!
        const symbolId = editor.saveBlockAsSymbol(targetId, 'CTA') as string
        editor.enterSymbolEdit(symbolId)
        const propertyId = editor.addSymbolProperty(targetId, 'label') as string
        const keyBefore = editor.document.value.symbols![symbolId].properties![0]!.key

        expect(editor.renameSymbolProperty(symbolId, propertyId, '   ')).toBe(false)
        expect(editor.renameSymbolProperty(symbolId, 'missing', 'Name')).toBe(false)
        expect(editor.renameSymbolProperty(symbolId, propertyId, 'CTA text')).toBe(true)

        const property = editor.document.value.symbols![symbolId].properties![0]!
        expect(property.label).toBe('CTA text')
        expect(property.key).toBe(keyBefore)

        // Exposing with an explicit name skips the inferred label.
        editor.addSymbolProperty(targetId, 'href', 'Target link')
        expect(editor.document.value.symbols![symbolId].properties![1]!.label).toBe('Target link')
      })
    })

    it('publishes a master block prop with inferred public metadata and persists it on exit', () => {
      withEditor((editor) => {
        editor.addBlock('button')
        const targetId = editor.selectedBlockId.value!
        const symbolId = editor.saveBlockAsSymbol(targetId, 'CTA') as string

        expect(editor.enterSymbolEdit(symbolId)).toBe(true)
        const textPropertyId = editor.addSymbolProperty(targetId, 'label') as string
        const urlPropertyId = editor.addSymbolProperty(targetId, 'href') as string

        const editingSymbol = editor.document.value.symbols![symbolId]
        expect(editingSymbol.properties).toEqual([
          expect.objectContaining({
            id: textPropertyId,
            key: 'text',
            label: 'Text',
            target: { blockId: targetId, prop: 'label' },
            control: { type: 'text' },
          }),
          expect.objectContaining({
            id: urlPropertyId,
            key: 'url',
            label: 'URL',
            target: { blockId: targetId, prop: 'href' },
            control: { type: 'url' },
          }),
        ])
        expect(editor.addSymbolProperty(targetId, 'label')).toBe(false)

        expect(editor.exitSymbolEdit()).toBe(true)
        expect(editor.document.value.symbols![symbolId].properties?.map(property => property.id))
          .toEqual([textPropertyId, urlPropertyId])
      })
    })

    it('removes a published property from the component master', () => {
      withEditor((editor) => {
        editor.addBlock('button')
        const targetId = editor.selectedBlockId.value!
        const symbolId = editor.saveBlockAsSymbol(targetId, 'CTA') as string
        editor.enterSymbolEdit(symbolId)
        const propertyId = editor.addSymbolProperty(targetId, 'disabled') as string

        expect(editor.removeSymbolProperty(symbolId, propertyId)).toBe(true)
        expect(editor.document.value.symbols![symbolId].properties).toBeUndefined()
        expect(editor.removeSymbolProperty(symbolId, propertyId)).toBe(false)
      })
    })

    it('removes published properties whose target block is deleted', () => {
      withEditor((editor) => {
        editor.addBlock('container')
        const rootId = editor.selectedBlockId.value!
        editor.addBlock('button')
        const targetId = editor.selectedBlockId.value!
        const symbolId = editor.saveBlockAsSymbol(rootId, 'CTA') as string

        editor.enterSymbolEdit(symbolId)
        editor.addSymbolProperty(targetId, 'label')
        editor.removeBlock(targetId)
        editor.exitSymbolEdit()

        expect(editor.document.value.symbols![symbolId].properties).toBeUndefined()
      })
    })

    it('sets and resets public property overrides on one component instance', () => {
      withEditor((editor) => {
        editor.addBlock('button')
        const targetId = editor.selectedBlockId.value!
        const symbolId = editor.saveBlockAsSymbol(targetId, 'CTA') as string
        const instanceId = editor.selectedBlockId.value!
        editor.enterSymbolEdit(symbolId)
        const propertyId = editor.addSymbolProperty(targetId, 'label') as string
        editor.exitSymbolEdit()

        expect(editor.setInstanceProperty(instanceId, propertyId, 'Buy now')).toBe(true)
        expect(editor.setInstanceProperty(instanceId, propertyId, Number.NaN)).toBe(false)
        let instance = findBlock(editor.document.value.blocks, instanceId)!
        expect((instance.props as { propertyValues?: Record<string, unknown> }).propertyValues)
          .toEqual({ [propertyId]: 'Buy now' })

        expect(editor.resetInstanceProperty(instanceId, propertyId)).toBe(true)
        instance = findBlock(editor.document.value.blocks, instanceId)!
        expect((instance.props as { propertyValues?: Record<string, unknown> }).propertyValues).toBeUndefined()
        expect(editor.resetInstanceProperty(instanceId, propertyId)).toBe(false)
      })
    })

    it('rejects invalid component Slot cross-references on load', () => {
      withEditor((editor) => {
        const invalid = {
          ...createPageDocument({ title: 'Invalid' }),
          symbols: {
            card: {
              id: 'card',
              name: 'Card',
              root: {
                id: 'root',
                type: 'container',
                props: {},
                children: [
                  { id: 'slot-a', type: 'slot', props: { name: 'content' } },
                  { id: 'slot-b', type: 'slot', props: { name: 'content' } },
                ],
              },
              variants: [{ id: 'default', name: 'Default', classes: [] }],
              defaultVariantId: 'default',
              updatedAt: '',
            },
          },
        }

        expect(editor.load(invalid)).toBe(false)
        expect(editor.errors.value).toContain('card: duplicate Slot name "content"')
      })
    })
  })

  describe('variables', () => {
    it('addVariable returns a unique, stable key derived from the label', () => {
      withEditor((editor) => {
        expect(editor.addVariable({ name: 'brand', value: '#000', type: 'color' })).toBe('brand')
        // key collision → suffixed
        expect(editor.addVariable({ name: 'brand', value: '#111', type: 'color' })).toBe('brand-2')
        // invalid label falls back to a generated key
        const generated = editor.addVariable({ name: '123', value: '1', type: 'number' })
        expect(generated).not.toBe('')
        expect(editor.variables.value).toHaveLength(3)
        // key derived from the label; name = the label
        expect(editor.variables.value[0]).toMatchObject({ key: 'brand', name: 'brand' })
      })
    })

    it('updateVariable edits value/type in place', () => {
      withEditor((editor) => {
        editor.addVariable({ name: 'brand', value: '#000', type: 'color' })
        editor.updateVariable(0, { value: '#fff', type: 'other' })
        expect(editor.variables.value[0]).toEqual({ key: 'brand', name: 'brand', value: '#fff', type: 'other' })
      })
    })

    it('renaming changes only the label — the key and every var() ref stay put', () => {
      withEditor((editor) => {
        editor.addVariable({ name: 'brand', value: '#14b8a6', type: 'color' })

        // block style, incl. a nested :hover state
        editor.addBlock('heading')
        const id = editor.selectedBlockId.value!
        editor.updateBlockStyle(id, {
          color: 'var(--brand)',
          states: { hover: { backgroundColor: 'var(--brand)' } },
        })

        // class registry
        editor.addBlock('heading')
        const classBlockId = editor.selectedBlockId.value!
        editor.updateBlockStyle(classBlockId, { borderColor: 'var(--brand)' })
        editor.createClass(classBlockId, 'card')

        // page style
        editor.updatePageStyle({ backgroundColor: 'var(--brand)' })

        expect(editor.renameVariable(0, 'Primary brand')).toBe(true)

        // label updated, CSS key frozen
        expect(editor.variables.value[0]).toMatchObject({ key: 'brand', name: 'Primary brand' })
        // every reference is untouched — the point of a stable key
        const block = findBlock(editor.document.value.blocks, id)!
        expect(block.style?.color).toBe('var(--brand)')
        expect(block.style?.states?.hover?.backgroundColor).toBe('var(--brand)')
        expect(editor.document.value.styles?.card?.borderColor).toBe('var(--brand)')
        expect(editor.document.value.settings.style?.backgroundColor).toBe('var(--brand)')
      })
    })

    it('renaming does not touch references held by other variables', () => {
      withEditor((editor) => {
        editor.addVariable({ name: 'brand', value: '#14b8a6', type: 'color' })
        editor.addVariable({ name: 'accent', value: 'var(--brand)', type: 'color' })

        editor.renameVariable(0, 'Primary')

        expect(editor.variables.value[0]).toMatchObject({ key: 'brand', name: 'Primary' })
        expect(editor.variables.value[1]?.value).toBe('var(--brand)')
      })
    })

    it('renaming leaves symbol-master references intact', () => {
      withEditor((editor) => {
        editor.addVariable({ name: 'brand', value: '#14b8a6', type: 'color' })
        editor.addBlock('heading')
        const id = editor.selectedBlockId.value!
        editor.updateBlockStyle(id, { color: 'var(--brand)' })
        const symbolId = editor.saveBlockAsSymbol(id, 'Card') as string

        editor.renameVariable(0, 'Primary')

        const master = editor.document.value.symbols![symbolId]
        expect(master.root.style?.color).toBe('var(--brand)')
      })
    })

    it('renaming to a blank label is rejected', () => {
      withEditor((editor) => {
        editor.addVariable({ name: 'brand', value: '#000', type: 'color' })
        expect(editor.renameVariable(0, '   ')).toBe(false)
        expect(editor.variables.value[0]?.name).toBe('brand')
      })
    })

    it('removeVariable and reorderVariables maintain the array', () => {
      withEditor((editor) => {
        editor.addVariable({ name: 'a', value: '1', type: 'number' })
        editor.addVariable({ name: 'b', value: '2', type: 'number' })
        editor.reorderVariables(0, 1)
        expect(editor.variables.value.map(v => v.key)).toEqual(['b', 'a'])
        editor.removeVariable(0)
        expect(editor.variables.value.map(v => v.key)).toEqual(['a'])
      })
    })
  })

  describe('shared globals context (globals mode)', () => {
    it('variables read/write the globals, not the document', () => {
      withGlobalsEditor((editor) => {
        editor.addVariable({ name: 'brand', value: '#000', type: 'color' })
        expect(editor.globals.value!.variables).toEqual([{ key: 'brand', name: 'brand', value: '#000', type: 'color' }])
        expect(editor.document.value.variables ?? []).toEqual([])
        expect(editor.variables.value).toEqual([{ key: 'brand', name: 'brand', value: '#000', type: 'color' }])
        expect(editor.effectiveDocument.value.variables).toEqual([{ key: 'brand', name: 'brand', value: '#000', type: 'color' }])
      })
    })

    it('breakpoints read/write the globals, and reset clears them there', () => {
      withGlobalsEditor((editor) => {
        const id = editor.addBreakpoint({ label: 'Small', direction: 'max', width: 600 })
        expect(editor.globals.value!.breakpoints?.some(b => b.id === id)).toBe(true)
        expect(editor.document.value.settings.breakpoints).toBeUndefined()
        expect(editor.breakpoints.value.some(b => b.id === id)).toBe(true)

        editor.resetBreakpoints()
        expect(editor.globals.value!.breakpoints).toBeUndefined()
      })
    })

    it('undo restores both the document and the globals in one timeline', () => {
      withGlobalsEditor((editor) => {
        editor.addBlock('heading') // document edit
        editor.addVariable({ name: 'brand', value: '#000', type: 'color' }) // globals edit
        expect(editor.variables.value).toHaveLength(1)

        editor.undo() // reverts the variable (globals)
        expect(editor.variables.value).toHaveLength(0)
        expect(editor.document.value.blocks).toHaveLength(1)

        editor.undo() // reverts the block (document)
        expect(editor.document.value.blocks).toHaveLength(0)

        editor.redo()
        expect(editor.document.value.blocks).toHaveLength(1)
        editor.redo()
        expect(editor.variables.value).toHaveLength(1)
      })
    })

    it('navigating history mid-transient aborts the gesture — no undo-stack corruption', () => {
      withEditor((editor) => {
        editor.addBlock('heading')
        const id = editor.selectedBlockId.value!

        // Open a scrub-style gesture and make one in-gesture edit (replaceCurrent).
        editor.beginTransient('Resize')
        editor.updateBlockStyle(id, { color: '#111111' })

        // Cmd+Z fires mid-gesture: it must abort the transient, not leave it open.
        editor.undo()
        expect(findBlock(editor.document.value.blocks, id)?.style?.color).toBeUndefined()

        // A subsequent commit must open a NEW history entry, not overwrite the
        // baseline we just navigated to (the corruption this guards against).
        editor.updateBlockStyle(id, { color: '#222222' })
        editor.endTransient()

        editor.undo()
        // Fixed: we land back on the clean one-heading baseline. Under the bug the
        // baseline entry was overwritten, so this undo would drop the block entirely.
        expect(editor.document.value.blocks).toHaveLength(1)
        expect(findBlock(editor.document.value.blocks, id)?.style?.color).toBeUndefined()
      })
    })

    it('renaming a variable changes only its label on the globals — refs stay put', () => {
      withGlobalsEditor((editor) => {
        editor.addVariable({ name: 'brand', value: '#14b8a6', type: 'color' })
        editor.addBlock('heading')
        const id = editor.selectedBlockId.value!
        editor.updateBlockStyle(id, { color: 'var(--brand)' })

        expect(editor.renameVariable(0, 'Primary')).toBe(true)
        expect(editor.globals.value!.variables?.[0]).toMatchObject({ key: 'brand', name: 'Primary' })
        // the document reference is untouched — stable key, cross-page safe
        expect(findBlock(editor.document.value.blocks, id)?.style?.color).toBe('var(--brand)')

        // undo reverts the label on the globals
        editor.undo()
        expect(editor.globals.value!.variables?.[0]).toMatchObject({ key: 'brand', name: 'brand' })
      })
    })

    it('setGlobalDefaults feeds the merged page defaults', () => {
      withGlobalsEditor((editor) => {
        expect(editor.setGlobalDefaults({ background: '#globals', style: { fontFamily: 'Inter' } })).toBe(true)
        expect(editor.globals.value!.defaults).toEqual({ background: '#globals', style: { fontFamily: 'Inter' } })
        expect(editor.effectiveDocument.value.settings.style?.fontFamily).toBe('Inter')
      })
    })

    it('setGlobals swaps the context and reseeds history', () => {
      withGlobalsEditor((editor) => {
        editor.addVariable({ name: 'a', value: '1', type: 'number' })
        editor.setGlobals(createGlobalSettings({ variables: [{ key: 'b', name: 'b', value: '2', type: 'number' }] }))
        expect(editor.variables.value.map(v => v.key)).toEqual(['b'])
        expect(editor.canUndo.value).toBe(false)
      })
    })

    it('setGlobalDefaults is a no-op without a globals (single-doc mode)', () => {
      withEditor((editor) => {
        expect(editor.setGlobalDefaults({ background: '#x' })).toBe(false)
        expect(editor.globals.value).toBeNull()
      })
    })

    it('class definitions live on the globals; block.classes stays on the document', () => {
      withGlobalsEditor((editor) => {
        editor.addBlock('heading')
        const id = editor.selectedBlockId.value!
        editor.updateBlockStyle(id, { color: '#000' })

        expect(editor.createClass(id, 'primary')).toBe(true)
        expect(editor.globals.value!.styles?.primary).toEqual({ color: '#000' })
        expect(editor.document.value.styles ?? {}).toEqual({})
        expect(findBlock(editor.document.value.blocks, id)?.classes).toEqual(['primary'])

        editor.updateClassStyle('primary', { color: '#111' })
        expect(editor.globals.value!.styles?.primary).toEqual({ color: '#111' })
      })
    })

    it('renameClass renames the globals def and rewrites refs on blocks + symbol masters', () => {
      withGlobalsEditor((editor) => {
        editor.addBlock('container')
        const id = editor.selectedBlockId.value!
        editor.updateBlockStyle(id, { color: '#000' })
        editor.createClass(id, 'card')
        const symbolId = editor.saveBlockAsSymbol(id, 'Card') as string

        expect(editor.renameClass('card', 'panel')).toBe(true)
        expect(editor.globals.value!.styles?.card).toBeUndefined()
        expect(editor.globals.value!.styles?.panel).toEqual({ color: '#000' })
        // the class ref inside the symbol master (on the globals) updated too
        expect(editor.globals.value!.symbols![symbolId].root.classes).toEqual(['panel'])
      })
    })

    it('deleteClass removes the globals def and strips the ref from blocks', () => {
      withGlobalsEditor((editor) => {
        editor.addBlock('heading')
        const id = editor.selectedBlockId.value!
        editor.applyClass(id, 'primary')
        expect(editor.globals.value!.styles?.primary).toEqual({})
        editor.deleteClass('primary')
        expect(editor.globals.value!.styles?.primary).toBeUndefined()
        expect(findBlock(editor.document.value.blocks, id)?.classes).toEqual([])
      })
    })

    it('saveBlockAsSymbol puts the master on the globals and an instance on the document', () => {
      withGlobalsEditor((editor) => {
        editor.addBlock('container')
        const containerId = editor.selectedBlockId.value!
        const symbolId = editor.saveBlockAsSymbol(containerId, 'Card') as string
        expect(symbolId).toBeTruthy()
        expect(editor.globals.value!.symbols![symbolId].root.id).toBe(containerId)
        expect(editor.document.value.symbols ?? {}).toEqual({})
        expect(editor.document.value.blocks[0]?.type).toBe('__symbol')
      })
    })

    it('deleteSymbol removes the globals master and strips document instances', () => {
      withGlobalsEditor((editor) => {
        editor.addBlock('container')
        const symbolId = editor.saveBlockAsSymbol(editor.selectedBlockId.value!, 'Card') as string
        editor.addSymbolInstance(symbolId)
        expect(editor.document.value.blocks).toHaveLength(2)

        editor.deleteSymbol(symbolId)
        expect(editor.globals.value!.symbols![symbolId]).toBeUndefined()
        expect(editor.document.value.blocks.every(b => (b.props as { symbolId?: string }).symbolId !== symbolId)).toBe(true)
      })
    })

    it('editing a symbol master persists back to the globals', () => {
      withGlobalsEditor((editor) => {
        editor.addBlock('container')
        const rootId = editor.selectedBlockId.value!
        const symbolId = editor.saveBlockAsSymbol(rootId, 'Card') as string

        expect(editor.enterSymbolEdit(symbolId)).toBe(true)
        editor.updateBlockStyle(rootId, { color: '#abc' })
        expect(editor.exitSymbolEdit()).toBe(true)

        expect(editor.globals.value!.symbols![symbolId].root.style?.color).toBe('#abc')
        // the page tree is restored to its instance
        expect(editor.document.value.blocks[0]?.type).toBe('__symbol')
      })
    })

    it('undo reverts a class added to the globals in one step', () => {
      withGlobalsEditor((editor) => {
        editor.addBlock('heading')
        const id = editor.selectedBlockId.value!
        editor.updateBlockStyle(id, { color: '#000' })
        editor.createClass(id, 'primary')
        expect(editor.globals.value!.styles?.primary).toBeDefined()

        editor.undo()
        expect(editor.globals.value!.styles?.primary).toBeUndefined()
        expect(findBlock(editor.document.value.blocks, id)?.classes ?? []).not.toContain('primary')
      })
    })
  })

  it('undo + redo travel through history', () => {
    withEditor((editor) => {
      editor.addBlock('heading')
      const firstSnapshot = editor.document.value
      editor.addBlock('heading')
      expect(editor.document.value.blocks).toHaveLength(2)

      editor.undo()
      expect(editor.document.value.blocks).toHaveLength(1)
      // After undo the document is logically the first snapshot.
      expect(editor.document.value.blocks[0]?.id).toBe(firstSnapshot.blocks[0]?.id)

      editor.redo()
      expect(editor.document.value.blocks).toHaveLength(2)
    })
  })

  it('coalesces a rapid run of field edits into one undo step', () => {
    withEditor((editor) => {
      editor.addBlock('heading')
      const id = editor.selectedBlockId.value!
      // Two style edits in immediate succession share the 'Edit block' label and
      // land well within the coalesce window, so they collapse into one step.
      editor.updateBlockStyle(id, { color: '#111' })
      editor.updateBlockStyle(id, { color: '#222' })
      expect(findBlock(editor.document.value.blocks, id)?.style?.color).toBe('#222')

      // A single undo reverts BOTH edits, back to the freshly-added block — the
      // add itself stays a separate step (discrete commands never coalesce).
      editor.undo()
      expect(editor.document.value.blocks).toHaveLength(1)
      expect(findBlock(editor.document.value.blocks, id)?.style?.color).toBeUndefined()
    })
  })

  describe('runtime plugins', () => {
    it('registerPlugins merges new block definitions into the live registry', () => {
      withEditor((editor) => {
        expect(editor.registry.value.callout).toBeUndefined()
        editor.registerPlugins([{
          name: 'callout',
          blocks: [{ type: 'callout', label: 'Callout', defaultProps: {}, element: 'uf-callout' }],
        }])
        expect(editor.registry.value.callout).toBeDefined()
        expect(editor.blockDefinitions.value.some(d => d.type === 'callout')).toBe(true)
      })
    })

    it('registerPlugins overrides an existing type (last-wins)', () => {
      withEditor((editor) => {
        editor.registerPlugins([{
          name: 'p',
          blocks: [{ type: 'heading', label: 'Custom Heading', defaultProps: {}, element: 'uf-h' }],
        }])
        expect(editor.registry.value.heading.label).toBe('Custom Heading')
      })
    })
  })
})
