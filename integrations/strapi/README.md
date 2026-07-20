# strapi-plugin-uframe (planned)

A Strapi custom-field plugin that embeds the [uframe](../../README.md) block
editor. Strapi's admin runs on **React**, so the field component will be a thin
React wrapper around the same `uframe/embed` iframe client used by the Directus
extension — storing a uframe `PageDocument` as a JSON custom field.

Status: **scaffold pending.** Directus is being built out first; the embed
delivery model (bundle the built embed app, serve it locally) is shared, so this
plugin will reuse `build/embed/`.

## Shape (intended)

- `register()` in the plugin's admin entry calls
  `app.customFields.register({ type: 'json', ... })`.
- The input component mounts `createUframeEditor({ target, src, document, onChange })`
  from `uframe/embed` and emits `onChange` back to Strapi's field state.
