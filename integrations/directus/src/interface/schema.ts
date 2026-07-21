import type { CollectionSchema, FieldSchema, NormalizedSchema, SchemaFieldType } from '@dremchee/uframe/core'

// Maps Directus introspection (/collections, /fields, /relations) into uframe's
// CMS-agnostic NormalizedSchema for the binding picker.
//
// v1 scope: scalar fields + many-to-one relations (including file fields, which
// Directus models as m2o to `directus_files`). One-to-many / many-to-many alias
// fields are skipped — list sources via relations are a later increment.

export interface DirectusCollection {
  collection: string
  meta?: { singleton?: boolean | null, hidden?: boolean | null } | null
}

export interface DirectusField {
  collection: string
  field: string
  type: string
  meta?: { interface?: string | null, special?: string[] | null, hidden?: boolean | null } | null
}

export interface DirectusRelation {
  collection: string
  field: string
  related_collection: string | null
}

function scalarType(directusType: string): SchemaFieldType {
  switch (directusType) {
    case 'text': return 'text'
    case 'integer':
    case 'bigInteger':
    case 'float':
    case 'decimal': return 'number'
    case 'boolean': return 'boolean'
    case 'date':
    case 'dateTime':
    case 'timestamp':
    case 'time': return 'date'
    case 'json':
    case 'csv': return 'json'
    default: return 'string'
  }
}

export function toNormalizedSchema(
  collections: DirectusCollection[],
  fields: DirectusField[],
  relations: DirectusRelation[],
): NormalizedSchema {
  // (collection.field) → m2o target collection.
  const relByField = new Map<string, string>()
  for (const r of relations) {
    if (r.related_collection)
      relByField.set(`${r.collection}.${r.field}`, r.related_collection)
  }

  const userCollections = collections.filter(c => !c.collection.startsWith('directus_'))

  return {
    collections: userCollections.map<CollectionSchema>((c) => {
      const own = fields.filter(f => f.collection === c.collection && !f.meta?.hidden)
      const out: FieldSchema[] = []

      for (const f of own) {
        // Skip o2m / m2m presentation aliases (no real column) — list sources
        // via relations are out of v1 scope.
        if (f.type === 'alias')
          continue

        const target = relByField.get(`${f.collection}.${f.field}`)
        if (target === 'directus_files') {
          out.push({ name: f.field, type: 'file' })
        }
        else if (target) {
          out.push({ name: f.field, type: 'relation', relation: { kind: 'm2o', collection: target } })
        }
        else {
          out.push({ name: f.field, type: scalarType(f.type) })
        }
      }

      return {
        name: c.collection,
        kind: c.meta?.singleton ? 'singleton' : 'collection',
        fields: out,
      }
    }),
  }
}
