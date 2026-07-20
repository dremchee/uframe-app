// Registers <uf-callout-svelte> (via the Callout.svelte import in index.ts).
import calloutCss from '../src/callout.css?inline'
import '../src/index'

// Standalone styling: in the editor the `css` field is injected for us; here we
// inject the same co-located CSS so the classes render on a blank page.
const style = document.createElement('style')
style.textContent = calloutCss
document.head.appendChild(style)
