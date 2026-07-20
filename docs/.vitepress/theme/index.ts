import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import HomeExtras from './HomeExtras.vue'
import LiveEditor from './LiveEditor.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  // Inject the home-page visual blocks right after the native feature grid.
  Layout: () => h(DefaultTheme.Layout, null, {
    'home-features-after': () => h(HomeExtras),
  }),
  enhanceApp({ app }) {
    app.component('LiveEditor', LiveEditor)
  },
}
