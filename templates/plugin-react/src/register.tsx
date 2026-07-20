import type { Root } from 'react-dom/client'
import type { CalloutProps } from './shared'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import Callout from './Callout'

// Wrap the React component in a custom element. This is the framework boundary:
// the editor mounts `<uf-callout-react>` and pushes props; React stays an
// internal detail. The editor reads props as attributes and/or the `props`
// property — support both.
class CalloutElement extends HTMLElement {
  private root?: Root
  private current: CalloutProps = { tone: 'info', text: 'Heads up!' }

  static observedAttributes = ['tone', 'text']

  connectedCallback() {
    this.root = createRoot(this)
    this.update()
  }

  disconnectedCallback() {
    this.root?.unmount()
    this.root = undefined
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null) {
    (this.current as Record<string, unknown>)[name] = value ?? undefined
    this.update()
  }

  // The editor pushes the whole props object here.
  set props(value: Partial<CalloutProps>) {
    this.current = { ...this.current, ...value }
    this.update()
  }

  get props(): CalloutProps {
    return this.current
  }

  private update() {
    this.root?.render(createElement(Callout, this.current))
  }
}

if (!customElements.get('uf-callout-react'))
  customElements.define('uf-callout-react', CalloutElement)
