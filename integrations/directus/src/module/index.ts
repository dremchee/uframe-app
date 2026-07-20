import { defineModule } from '@directus/extensions-sdk'
import ModuleView from './module.vue'

// Left-bar module: a master-detail manager for uframe pages, backed by hidden
// collections the module bootstraps itself (uframe_pages + uframe_globals).
// Single-document editing per page via the embedded uframe editor.
export default defineModule({
  id: 'uframe',
  name: 'uframe',
  icon: 'dashboard',
  routes: [
    { path: '', component: ModuleView },
  ],
})
