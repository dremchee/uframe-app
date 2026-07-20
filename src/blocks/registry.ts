import type { VueBlockDefinition } from '@/blocks/registry-helpers'
// The default block manifest. Each block's definition lives next to its
// renderer (src/blocks/<type>/index.ts); this file just orders them for the
// Add panel. Categories group automatically from each def's `category` field;
// first occurrence wins for section order.
import { buttonDef } from '@/blocks/button'
import { checkboxDef } from '@/blocks/checkbox'
import { containerDef } from '@/blocks/container'
import { dataItemDef } from '@/blocks/data-item'
import { dataListDef } from '@/blocks/data-list'
import { divDef } from '@/blocks/div'
import { dividerDef } from '@/blocks/divider'
import { embedDef } from '@/blocks/embed'
import { formDef } from '@/blocks/form'
import { headingDef } from '@/blocks/heading'
import { imageDef } from '@/blocks/image'
import { inputDef } from '@/blocks/input'
import { labelDef } from '@/blocks/label'
import { linkDef } from '@/blocks/link'
import { listDef } from '@/blocks/list'
import { listItemDef } from '@/blocks/list-item'
import { paragraphDef } from '@/blocks/paragraph'
import { radioDef } from '@/blocks/radio'
import { sectionDef } from '@/blocks/section'
import { selectDef } from '@/blocks/select'
import { selectOptionDef } from '@/blocks/select-option'
import { slotDef } from '@/blocks/slot'
import { spacerDef } from '@/blocks/spacer'
import { textDef } from '@/blocks/text'
import { textAreaDef } from '@/blocks/text-area'

export type { VueBlockDefinition } from '@/blocks/registry-helpers'

// Each def is fully typed at its own site (e.g. `VueBlockDefinition<HeadingBlockProps>`).
// Collecting them into one array typed as the base `VueBlockDefinition` is a real
// TS variance clash — `renderHtml`/`createBlock` are contravariant in TProps, so a
// specific def isn't substitutable for `VueBlockDefinition<Record<string, unknown>>`.
// The registry treats every block uniformly at runtime, so erase the prop type here.
export const defaultBlockDefinitions = [
  // Structure
  sectionDef,
  containerDef,
  dividerDef,
  spacerDef,
  slotDef,
  // Basic
  divDef,
  linkDef,
  buttonDef,
  // Typography
  headingDef,
  paragraphDef,
  textDef,
  listDef,
  listItemDef,
  // Media
  imageDef,
  embedDef,
  // Forms
  formDef,
  labelDef,
  inputDef,
  textAreaDef,
  checkboxDef,
  radioDef,
  selectDef,
  selectOptionDef,
  // Dynamic (CMS binding)
  dataListDef,
  dataItemDef,
] as unknown as VueBlockDefinition[]
