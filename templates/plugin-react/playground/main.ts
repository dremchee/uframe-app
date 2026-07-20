// Registers <uf-callout-react>. The element is then used directly in index.html
// — no editor required to develop the block in isolation.
import calloutCss from '../src/callout.css?inline'
import '../src/index'

// Standalone styling: in the editor the `css` field is injected for us; here we
// inject the same co-located CSS so the classes render on a blank page.
const style = document.createElement('style')
style.textContent = calloutCss
document.head.appendChild(style)
