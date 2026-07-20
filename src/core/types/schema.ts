// Normalized, CMS-agnostic schema the editor's binding picker consumes. Each
// CMS adapter maps its own collection/field metadata into this shape and pushes
// it over `uframe:setSchema`. See docs/plans/dynamic-content-plan.md §2.

export type RelationKind = 'm2o' | 'o2m' | 'm2m'

/**
 * UI hint for the binding picker — `file` → image `src`, `relation` →
 * traversable (`m2o`) or a `collection-list` source (`o2m`/`m2m`). A small
 * normalized set, not the host CMS's native type zoo.
 */
export type SchemaFieldType
  = | 'string'
    | 'text'
    | 'richtext'
    | 'number'
    | 'boolean'
    | 'date'
    | 'file'
    | 'json'
    | 'relation'

export interface FieldSchema {
  name: string
  label?: string
  type: SchemaFieldType
  /** Present when `type === 'relation'`; lets the picker walk into `collection`. */
  relation?: { kind: RelationKind, collection: string }
}

export interface CollectionSchema {
  name: string
  label?: string
  /** `singleton` = one record (home/contacts); `collection` = many rows. */
  kind: 'collection' | 'singleton'
  fields: FieldSchema[]
}

export interface NormalizedSchema {
  collections: CollectionSchema[]
}
