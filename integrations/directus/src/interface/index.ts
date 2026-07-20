import { defineInterface } from '@directus/extensions-sdk'
import InterfaceComponent from './interface.vue'

// A custom interface for a JSON field that holds a uframe `PageDocument`.
// Attach it to the `document` field of a `pages` collection — Directus owns the
// list / permissions / revisions / draft-publish, this just edits one record's
// document in an embedded uframe editor (single-document mode).
export default defineInterface({
  id: 'uframe-editor',
  name: 'uframe Page Editor',
  icon: 'web',
  description: 'Edit a uframe PageDocument stored in this JSON field.',
  component: InterfaceComponent,
  types: ['json'],
  group: 'standard',
  options: null,
})
