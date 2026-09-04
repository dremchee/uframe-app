import type { Component } from 'vue'
import type { BlockPreset, BlockPresetChild, ElementBlockProps } from '@/core'
import { Columns3, Frame, LayoutGrid, PanelTop, Rows3, WrapText } from '@lucide/vue'
import { ELEMENT_BLOCK_TYPE } from '@/core'

/**
 * Structural starting points for rapid layout prototyping. Every entry is a
 * plain Element with insert-time styles (and, for Section and Grid, a starter
 * subtree) — the same block the author could build by hand, so the Quick
 * layout controls and the full Style panel keep working on it afterwards.
 * Styles land in the block's local layer and move into an auto-named class on
 * the first edit, exactly like the `defaultStyle` of Button or Input.
 */

const cell: BlockPresetChild = { type: ELEMENT_BLOCK_TYPE }

export const elementPresets: BlockPreset<ElementBlockProps, Component>[] = [
  {
    id: 'section',
    label: 'Section',
    description: 'Full-width band with a centered container',
    icon: PanelTop,
    props: { tag: 'section' },
    style: { paddingTop: '64px', paddingRight: '24px', paddingBottom: '64px', paddingLeft: '24px' },
    children: [
      { type: ELEMENT_BLOCK_TYPE, style: { maxWidth: '1200px', marginLeft: 'auto', marginRight: 'auto' } },
    ],
  },
  {
    id: 'container',
    label: 'Container',
    description: 'Centered max-width wrapper',
    icon: Frame,
    style: { maxWidth: '1200px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '24px', paddingRight: '24px' },
  },
  {
    id: 'v-stack',
    label: 'V Stack',
    description: 'Vertical flex stack',
    icon: Rows3,
    style: { display: 'flex', flexDirection: 'column', gap: '16px' },
  },
  {
    id: 'h-stack',
    label: 'H Stack',
    description: 'Horizontal flex row',
    icon: Columns3,
    style: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px' },
  },
  {
    id: 'grid',
    label: 'Grid',
    description: 'Three equal columns',
    icon: LayoutGrid,
    style: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px' },
    children: [cell, cell, cell],
  },
  {
    id: 'wrap',
    label: 'Wrap',
    description: 'Row that wraps onto new lines',
    icon: WrapText,
    style: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '16px' },
  },
]
