import type { PageDocument } from '@/core/types/page-document'
import { pageDocumentSchema } from '@/core/schemas/page-document.schema'

export function serializePageDocument(document: PageDocument): string {
  return JSON.stringify(document, null, 2)
}

export function parsePageDocument(input: unknown): PageDocument {
  return pageDocumentSchema.parse(input) as PageDocument
}

export function safeParsePageDocument(input: unknown) {
  return pageDocumentSchema.safeParse(input)
}
