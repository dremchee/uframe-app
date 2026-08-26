<script setup lang="ts">
import type { PageEditorInstance } from '@/vue/context/editor-context'
import { Download } from '@lucide/vue'
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui'
import {
  createZip,
  mergeGlobalsIntoDocument,
  renderDocumentToHtml,
  renderFontHead,
  renderSiteFiles,
  serializePageDocument,
  slugify,
} from '@/core'
import { exportBaseStyles } from '@/styles/page-frame'
import { useUframeI18n } from '@/vue/i18n'

const props = defineProps<{
  editor: PageEditorInstance
  untrustedEmbeds: boolean
}>()

const { t } = useUframeI18n()

function downloadFile(content: string | Blob, type: string, filename: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function exportHtml() {
  const document = props.editor.effectiveDocument.value
  const html = renderDocumentToHtml(document, props.editor.registry.value, {
    title: document.title,
    baseStyles: exportBaseStyles,
    extraHead: renderFontHead(document.fonts),
    untrustedEmbeds: props.untrustedEmbeds,
  })
  downloadFile(html, 'text/html;charset=utf-8', `${slugify(document.title)}.html`)
}

function projectJson(): string {
  if (props.editor.isMultiPage.value) {
    return JSON.stringify({
      pages: props.editor.pagesView.value,
      globals: props.editor.globals.value ?? undefined,
    }, null, 2)
  }
  return serializePageDocument(props.editor.effectiveDocument.value)
}

function exportJson() {
  downloadFile(projectJson(), 'application/json;charset=utf-8', 'project.json')
}

function exportZip() {
  const globals = props.editor.globals.value
  const documents = props.editor.isMultiPage.value
    ? props.editor.pagesView.value
    : [props.editor.effectiveDocument.value]
  const effectiveDocuments = documents.map(document =>
    globals ? mergeGlobalsIntoDocument(document, globals) : document,
  )
  const files = renderSiteFiles(effectiveDocuments, props.editor.registry.value, {
    baseStyles: exportBaseStyles,
    extraHead: renderFontHead(props.editor.fontConfig.value),
    untrustedEmbeds: props.untrustedEmbeds,
  })
  files.push({ name: 'project.json', content: projectJson() })
  downloadFile(createZip(files), 'application/zip', 'site.zip')
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger>
      <Button variant="outline" size="icon" type="button" :title="t('toolbar.export')" :aria-label="t('toolbar.export')">
        <Download />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @select="exportHtml">
        {{ t('toolbar.exportPageHtml') }}
      </DropdownMenuItem>
      <DropdownMenuItem @select="exportZip">
        {{ t('toolbar.exportSiteZip') }}
      </DropdownMenuItem>
      <DropdownMenuItem @select="exportJson">
        {{ t('toolbar.exportProjectJson') }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
