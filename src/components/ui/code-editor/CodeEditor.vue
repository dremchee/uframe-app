<script setup lang="ts">
import type { Extension } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { css as cssLang } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { javascript } from '@codemirror/lang-javascript'
import { bracketMatching, defaultHighlightStyle, indentOnInput, syntaxHighlighting } from '@codemirror/language'
import { EditorState } from '@codemirror/state'
import { EditorView, highlightActiveLine, highlightActiveLineGutter, keymap, lineNumbers } from '@codemirror/view'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { cn } from '@/lib/utils'

export type CodeLanguage = 'html' | 'css' | 'js' | 'plain'

const props = withDefaults(defineProps<{
  modelValue: string
  language?: CodeLanguage
  readonly?: boolean
  /** Lines visible before scroll kicks in (controls min height). */
  rows?: number
  /** Hide the line-number gutter — useful for plain read-only viewers. */
  hideLineNumbers?: boolean
  class?: string
  placeholder?: string
}>(), {
  language: 'plain',
  readonly: false,
  rows: 8,
  hideLineNumbers: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const container = ref<HTMLElement | null>(null)
let view: EditorView | null = null
// Guard the reactive watch from re-feeding the editor with its own emission.
let updatingFromOutside = false

// One place to register language packs. Add a new entry here and bump
// `CodeLanguage` above — that's the whole drill.
const LANGUAGES: Record<CodeLanguage, () => Extension[]> = {
  html: () => [html()],
  css: () => [cssLang()],
  js: () => [javascript({ jsx: false, typescript: false })],
  plain: () => [],
}

function languageExtension(lang: CodeLanguage): Extension[] {
  return (LANGUAGES[lang] ?? LANGUAGES.plain)()
}

function buildExtensions(): Extension[] {
  const exts: Extension[] = []
  if (!props.hideLineNumbers)
    exts.push(lineNumbers())
  if (!props.readonly) {
    exts.push(highlightActiveLine(), highlightActiveLineGutter(), history(), indentOnInput())
  }
  exts.push(
    bracketMatching(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
    EditorView.lineWrapping,
    EditorState.readOnly.of(props.readonly),
    EditorView.editable.of(!props.readonly),
    EditorView.theme({
      '&': { fontSize: '13px' },
      '.cm-content': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Cascadia Mono", "Roboto Mono", monospace' },
      '.cm-gutters': { backgroundColor: 'transparent', border: 'none', color: 'var(--uf-muted)' },
      '.cm-activeLine': { backgroundColor: 'rgb(15 23 42 / 4%)' },
      '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--uf-text)' },
      '&.cm-focused': { outline: 'none' },
    }),
    ...languageExtension(props.language),
    EditorView.updateListener.of((v) => {
      if (!v.docChanged || updatingFromOutside)
        return
      emit('update:modelValue', v.state.doc.toString())
    }),
  )
  return exts
}

function mountEditor() {
  if (!container.value)
    return
  view?.destroy()
  view = new EditorView({
    parent: container.value,
    state: EditorState.create({
      doc: props.modelValue ?? '',
      extensions: buildExtensions(),
    }),
  })
}

onMounted(mountEditor)

// Push outside model changes into the editor without emitting back.
// Critical: reading props.modelValue inside a watchEffect would re-mount the
// view on every keystroke (own emission becomes a dep), which kills focus.
watch(() => props.modelValue, (next) => {
  if (!view)
    return
  const cur = view.state.doc.toString()
  if (cur === (next ?? ''))
    return
  updatingFromOutside = true
  try {
    view.dispatch({
      changes: { from: 0, to: cur.length, insert: next ?? '' },
    })
  }
  finally {
    updatingFromOutside = false
  }
})

// Structural props that genuinely require a rebuild — language pack swap,
// readonly toggle, gutter toggle. They don't change while the user is typing,
// so re-mounting on them is fine.
watch(
  () => [props.language, props.readonly, props.hideLineNumbers],
  () => mountEditor(),
)

const minHeight = computed(() => `${Math.max(props.rows, 3) * 1.4 * 13}px`)

onBeforeUnmount(() => {
  view?.destroy()
  view = null
})
</script>

<template>
  <div
    ref="container"
    :class="cn(
      'uf-ui-code-editor relative w-full overflow-auto rounded-md border border-uf-border bg-uf-panel shadow-xs',
      'focus-within:ring-1 focus-within:ring-uf-accent focus-within:border-uf-accent',
      props.class,
    )"
    :style="{ minHeight }"
  />
</template>

<style>
/* Reka/CM6 styles bleed when scoped — keep these global. Just normalise the
   container so it fills the bordered wrapper above. */
.uf-ui-code-editor .cm-editor {
  height: 100%;
  outline: none;
}
.uf-ui-code-editor .cm-scroller {
  font-family: inherit;
}
</style>
