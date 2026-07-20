// The iframe content stylesheet is split in two raw-imported CSS files (real
// CSS files for editor tooling): page-reset.css — the generic reset + base
// typography, shared with HTML export — and page-frame.css — editor-only
// machinery (canvas wrappers, placeholders) plus the `uf-*` block defaults
// that dress the canvas markup.
import pageFrame from './page-frame.css?raw'
import pageReset from './page-reset.css?raw'

/**
 * Canvas / preview iframe stylesheet: reset + editor frame. Injected into the
 * iframe's <style> by CanvasViewport / PagePreview.
 */
export const pageFrameStyles = `${pageReset}\n${pageFrame}`

/**
 * Baseline for exported documents: the reset alone. No editor machinery and
 * no `uf-*` rules — exported markup carries only user-authored classes.
 */
export const exportBaseStyles = pageReset
