import type { PageBlock } from '@/core'
import type { VueBlockDefinition } from '@/blocks/registry-helpers'
import { Grid3X3 } from '@lucide/vue'
import DivBlock from '@/blocks/div/DivBlock.vue'
import { createShortId } from '@/core'

type EmptyProps = Record<string, never>

function div(style: PageBlock['style'], children: PageBlock[] = []): PageBlock {
  return {
    id: createShortId('div'),
    type: 'div',
    props: {},
    style,
    ...(children.length ? { children } : {}),
  }
}

function heading(content: string): PageBlock {
  return {
    id: createShortId('heading'),
    type: 'heading',
    props: { content, level: 3 },
    style: { marginTop: '0', marginBottom: '8px', fontSize: '20px' },
  }
}

function paragraph(content: string): PageBlock {
  return {
    id: createShortId('paragraph'),
    type: 'paragraph',
    props: { content },
    style: { marginTop: '0', marginBottom: '0', color: '#475569', lineHeight: '1.5' },
  }
}

/** A ready-to-edit composition showing the valid CSS Subgrid relationship. */
function createSubgridDemo(): PageBlock<EmptyProps> {
  const cardStyle = {
    paddingTop: '20px',
    paddingRight: '20px',
    paddingBottom: '20px',
    paddingLeft: '20px',
    backgroundColor: '#ffffff',
    borderStyle: 'solid' as const,
    borderColor: '#cbd5e1',
    borderTopWidth: '1px',
    borderRightWidth: '1px',
    borderBottomWidth: '1px',
    borderLeftWidth: '1px',
    borderTopLeftRadius: '12px',
    borderTopRightRadius: '12px',
    borderBottomRightRadius: '12px',
    borderBottomLeftRadius: '12px',
  }

  const inheritedGrid = div({
    display: 'grid',
    gridTemplateColumns: 'subgrid',
    gridColumn: '1 / -1',
    gap: '16px',
  }, [
    div(cardStyle, [
      heading('Первая колонка'),
      paragraph('Узкая карточка во вложенной сетке. Её границы совпадают с первой колонкой родителя.'),
    ]),
    div(cardStyle, [
      heading('Вторая колонка'),
      paragraph('Широкая карточка наследует вторую колонку. Измените треки у родительского Grid — границы обеих карточек перестроятся вместе.'),
    ]),
  ])

  return div({
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)',
    gap: '16px',
    paddingTop: '24px',
    paddingRight: '24px',
    paddingBottom: '24px',
    paddingLeft: '24px',
    backgroundColor: '#f8fafc',
    borderStyle: 'solid',
    borderColor: '#94a3b8',
    borderTopWidth: '1px',
    borderRightWidth: '1px',
    borderBottomWidth: '1px',
    borderLeftWidth: '1px',
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '16px',
    borderBottomRightRadius: '16px',
    borderBottomLeftRadius: '16px',
  }, [
    div({ gridColumn: '1 / -1' }, [
      heading('Демонстрация CSS Subgrid'),
      paragraph('Родитель задаёт колонки 1fr / 2fr. Выберите вложенный Div Block в Layers: у него включены Grid, Subgrid и растяжение на все колонки родителя.'),
    ]),
    inheritedGrid,
  ]) as PageBlock<EmptyProps>
}

export const subgridDemoDef: VueBlockDefinition<EmptyProps> = {
  type: 'subgrid-demo',
  label: 'Subgrid demo',
  description: 'Ready-made nested grid example',
  category: 'Structure',
  defaultProps: {},
  renderComponent: DivBlock,
  icon: Grid3X3,
  acceptsChildren: true,
  createBlock: createSubgridDemo,
  renderHtml(_block, ctx) {
    return `<div class="${ctx.classes}">${ctx.renderChildren()}</div>`
  },
}
