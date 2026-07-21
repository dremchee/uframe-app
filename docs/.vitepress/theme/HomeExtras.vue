<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

// Visual blocks for the home page, injected after the feature grid via the
// `home-features-after` layout slot. Styled with VitePress theme tokens so it
// tracks the site's light/dark palette and matches the native feature cards.
const SVG = 'width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'

// Drop-in host snippet — proves the "tiny client" claim at a glance.
const code = `import { createUframeEditor } from '@dremchee/uframe/embed'

const editor = createUframeEditor({
  target: document.querySelector('#editor'),
  src: '/uframe/index.html',
  document: page,
  onSave: doc => persist(doc),
})`

const frameworks = ['React', 'Vue', 'Svelte', 'Solid', 'Vanilla JS']

const steps = [
  {
    n: '1',
    title: 'Mount the iframe',
    text: 'createUframeEditor() drops an isolated editor app into any element — vanilla JS, no framework required on the host.',
  },
  {
    n: '2',
    title: 'Drive it over postMessage',
    text: 'Pass a document, theme and readonly in; a tiny typed protocol keeps the host and the editor in sync both ways.',
  },
  {
    n: '3',
    title: 'Own the data',
    text: 'Receive change / save callbacks carrying a plain PageDocument JSON. Persist it to any backend you like.',
  },
]

const cms = [
  {
    title: 'Design a template',
    text: 'Build the page visually with blocks — once, then reuse it across every record.',
    image: '/images/cms-template.png',
    blueprintImage: '/images/cms-template-blueprint.png',
    alt: '3D layered template layout illustration',
  },
  {
    title: 'Bind CMS fields',
    text: 'Point blocks at collection fields with Data List / Data Item. The document stays pure design + bindings — no content baked in.',
    image: '/images/cms-bind-fields.png',
    blueprintImage: '/images/cms-bind-fields-blueprint.png',
    alt: '3D CMS fields binding illustration',
  },
  {
    title: 'Ship plain JSON',
    text: 'resolveDocument() merges your data on the server. Bring Directus, Strapi, Payload — or any source.',
    image: '/images/cms-json.png',
    blueprintImage: '/images/cms-json-blueprint.png',
    alt: '3D JSON export illustration',
  },
]

const audiences = [
  {
    // rocket
    icon: `<svg xmlns="http://www.w3.org/2000/svg" ${SVG}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`,
    title: 'Product teams',
    text: 'Add an in-app page/content builder to a SaaS, CMS, or landing tool — embed it over the tiny client and host on any stack.',
  },
  {
    // blocks
    icon: `<svg xmlns="http://www.w3.org/2000/svg" ${SVG}><rect width="7" height="7" x="14" y="3" rx="1"/><path d="M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3"/></svg>`,
    title: 'Vue teams',
    text: 'Extend the editor with your own blocks, plugins, toolbar buttons, and sidebar panels by importing the Vue component.',
  },
  {
    // palette
    icon: `<svg xmlns="http://www.w3.org/2000/svg" ${SVG}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg>`,
    title: 'Platforms & agencies',
    text: 'Offer white-label editing — rebrand the chrome with theme tokens, kept isolated behind the iframe boundary.',
  },
]

const paths = [
  {
    badge: 'uframe/embed',
    title: 'Embed client',
    text: 'Mount an iframe and drive it over a tiny typed postMessage protocol. Any host stack, full isolation, nothing heavy in your bundle.',
    points: ['Any framework', 'Iframe sandbox', 'A few KB on the host'],
    link: '/guide/getting-started',
    cta: 'Get started',
  },
  {
    badge: '<PageEditor>',
    title: 'Vue component',
    text: 'Import the editor directly when you need to register custom blocks, plugins, and panels. Pulls Vue into your bundle.',
    points: ['Custom blocks', 'Plugins & panels', 'In-app integration'],
    link: '/guide/extending',
    cta: 'Extend the editor',
  },
]

// Scroll-reveal: fade + rise each block as it enters the viewport. Client-only
// (guarded by onMounted) so SSR output stays static and accessible.
const root = ref<HTMLElement>()
let observer: IntersectionObserver | undefined

onMounted(() => {
  if (!('IntersectionObserver' in window)) {
    root.value?.querySelectorAll('.he-reveal').forEach(el => el.classList.add('he-in'))
    return
  }
  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('he-in')
        observer?.unobserve(entry.target)
      }
    }
  }, { threshold: 0.12 })
  root.value?.querySelectorAll('.he-reveal').forEach(el => observer!.observe(el))
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <section ref="root" class="home-extras">
    <!-- Live editor: show, don't tell. -->
    <div class="he-container">
      <div class="he-head he-reveal">
        <span class="he-eyebrow">Live</span>
        <h2 class="he-title">
          Try the real editor, right here
        </h2>
        <p class="he-sub">
          This is the actual editor running in an iframe, driven by the embed
          client — exactly the integration shown in the docs.
        </p>
      </div>
    </div>
    <div class="he-demo he-reveal">
      <ClientOnly>
        <LiveEditor />
      </ClientOnly>
    </div>

    <div class="he-container">
      <!-- Drop-in snippet. -->
      <div class="he-head he-reveal">
        <span class="he-eyebrow">Tiny host client</span>
        <h2 class="he-title">
          A few lines to drop it in
        </h2>
        <p class="he-sub">
          No editor code in your bundle — just an iframe and a typed
          postMessage client.
        </p>
      </div>
      <div class="he-code he-reveal">
        <div class="he-code-bar">
          <span class="he-dot" /><span class="he-dot" /><span class="he-dot" />
          <span class="he-code-name">host.ts</span>
        </div>
        <pre class="he-code-pre"><code>{{ code }}</code></pre>
      </div>

      <!-- Framework-neutral strip. -->
      <div class="he-strip he-reveal">
        <span class="he-strip-label">Drive it from</span>
        <span v-for="f in frameworks" :key="f" class="he-chip">{{ f }}</span>
      </div>

      <!-- Who it's for. -->
      <div class="he-head he-reveal">
        <span class="he-eyebrow">Who it's for</span>
        <h2 class="he-title">
          An editor engine, not a website builder
        </h2>
        <p class="he-sub">
          uframe is the editor you embed in your own app — you own the data, the
          backend, and the experience around it.
        </p>
      </div>
      <div class="he-grid he-grid--3">
        <article
          v-for="(a, i) in audiences"
          :key="a.title"
          class="he-card he-reveal"
          :style="{ '--he-delay': `${i * 90}ms` }"
        >
          <div class="he-icon" aria-hidden="true" v-html="a.icon" />
          <h3 class="he-card-title">
            {{ a.title }}
          </h3>
          <p class="he-card-text">
            {{ a.text }}
          </p>
        </article>
      </div>

      <!-- How it works. -->
      <div class="he-head he-reveal">
        <span class="he-eyebrow">How it works</span>
        <h2 class="he-title">
          Three moving parts
        </h2>
        <p class="he-sub">
          An isolated iframe, a typed message channel, and plain JSON out.
        </p>
      </div>
      <div class="he-grid he-grid--3">
        <div
          v-for="(s, i) in steps"
          :key="s.n"
          class="he-step he-reveal"
          :style="{ '--he-delay': `${i * 90}ms` }"
        >
          <span class="he-num">{{ s.n }}</span>
          <h3 class="he-card-title">
            {{ s.title }}
          </h3>
          <p class="he-card-text">
            {{ s.text }}
          </p>
        </div>
      </div>

      <!-- Two ways to integrate. -->
      <div class="he-head he-reveal">
        <span class="he-eyebrow">Integrate your way</span>
        <h2 class="he-title">
          Two ways to integrate
        </h2>
        <p class="he-sub">
          Embed-first, but not embed-only — pick the path that fits your host.
        </p>
      </div>
      <div class="he-grid he-grid--2">
        <a
          v-for="(p, i) in paths"
          :key="p.title"
          class="he-card he-card--link he-reveal"
          :style="{ '--he-delay': `${i * 90}ms` }"
          :href="p.link"
        >
          <code class="he-badge">{{ p.badge }}</code>
          <h3 class="he-card-title">
            {{ p.title }}
          </h3>
          <p class="he-card-text">
            {{ p.text }}
          </p>
          <ul class="he-points">
            <li v-for="point in p.points" :key="point">
              {{ point }}
            </li>
          </ul>
          <span class="he-cta">{{ p.cta }} →</span>
        </a>
      </div>

      <!-- Bring your own CMS. -->
      <div class="he-head he-reveal">
        <span class="he-eyebrow">Dynamic content</span>
        <h2 class="he-title">
          Bring your own CMS
        </h2>
        <p class="he-sub">
          Design templates that bind to collection fields, then resolve them to
          static JSON on your server.
        </p>
      </div>
      <div class="he-grid he-grid--3">
        <div
          v-for="(c, i) in cms"
          :key="c.title"
          class="he-step he-step--visual-card he-reveal"
          :style="{ '--he-delay': `${i * 90}ms` }"
        >
          <div class="he-step-visual">
            <img
              class="he-step-image he-step-image--blueprint"
              :src="c.blueprintImage"
              :alt="c.alt"
              loading="lazy"
              width="1448"
              height="1086"
            >
            <img
              class="he-step-image he-step-image--color"
              :src="c.image"
              alt=""
              aria-hidden="true"
              loading="lazy"
              width="1448"
              height="1086"
            >
          </div>
          <h3 class="he-card-title">
            {{ c.title }}
          </h3>
          <p class="he-card-text">
            {{ c.text }}
          </p>
        </div>
      </div>

      <!-- Closing CTA. -->
      <div class="he-cta-band he-reveal">
        <h2 class="he-cta-title">
          Drop a real editor into your app
        </h2>
        <p class="he-cta-sub">
          Embed it over a tiny client, keep your stack, own your data.
        </p>
        <div class="he-cta-actions">
          <a class="he-btn he-btn--brand" href="/guide/getting-started">Get started</a>
          <a class="he-btn he-btn--ghost" href="/demo">Live demo</a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-extras {
  padding: 0 24px;
  /* Contain the demo's big ambient glow horizontally (no x-scrollbar) while
     letting it bleed vertically into the surrounding sections. `clip` (not
     `hidden`) keeps the y-axis visible. */
  overflow-x: clip;
}

.he-container {
  max-width: 1152px;
  margin: 0 auto;
  padding: 16px 0 0;
}

.he-head {
  margin: 64px 0 32px;
  text-align: center;
}

.he-eyebrow {
  display: inline-block;
  margin-bottom: 14px;
  padding: 5px 14px;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.he-title {
  font-size: clamp(1.6rem, 3.4vw, 2.4rem);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.025em;
  border: 0;
  padding: 0;
  margin: 0;
  color: var(--vp-c-text-1);
}

.he-sub {
  margin: 12px auto 0;
  max-width: 580px;
  color: var(--vp-c-text-2);
  font-size: 16px;
  line-height: 1.6;
}

/* ---- Live demo ----------------------------------------------------------- */

.he-demo {
  position: relative;
  z-index: 0;
  margin-top: 8px;
}

/* Oversized brand aura behind the live editor — a soft glow that bleeds up and
   down into the page background. Sits behind the frame (z-index -1); horizontal
   spill is clipped by `.home-extras { overflow-x: clip }`. */
.he-demo::before {
  content: "";
  position: absolute;
  z-index: -1;
  top: -260px;
  bottom: -260px;
  left: 50%;
  width: 88vw;
  transform: translateX(-50%);
  background: radial-gradient(
    58% 52% at 50% 50%,
    rgba(99, 102, 241, 0.55),
    rgba(139, 92, 246, 0.34) 46%,
    transparent 74%
  );
  filter: blur(150px);
  pointer-events: none;
}

.dark .he-demo::before {
  background: radial-gradient(
    58% 52% at 50% 50%,
    rgba(99, 102, 241, 0.72),
    rgba(139, 92, 246, 0.5) 46%,
    transparent 76%
  );
}

/* ---- Drop-in code -------------------------------------------------------- */

.he-code {
  max-width: 720px;
  margin: 0 auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  overflow: hidden;
  background: var(--vp-c-bg-alt);
}

.he-code-bar {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.he-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--vp-c-gray-3, var(--vp-c-divider));
}

.he-code-name {
  margin-left: 6px;
  color: var(--vp-c-text-3);
  font-size: 12px;
  font-family: var(--vp-font-family-mono);
}

.he-code-pre {
  margin: 0;
  padding: 18px 20px;
  overflow-x: auto;
}

.he-code-pre code {
  font-family: var(--vp-font-family-mono);
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--vp-c-text-1);
  white-space: pre;
}

/* ---- Framework strip ----------------------------------------------------- */

.he-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 28px;
}

.he-strip-label {
  color: var(--vp-c-text-3);
  font-size: 13px;
}

.he-chip {
  padding: 5px 13px;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 500;
}

/* ---- Grids --------------------------------------------------------------- */

.he-grid {
  display: grid;
  gap: 24px;
}

.he-grid--3 {
  grid-template-columns: repeat(3, 1fr);
}

.he-grid--2 {
  grid-template-columns: repeat(2, 1fr);
}

@media (max-width: 768px) {
  .he-grid--3,
  .he-grid--2 {
    grid-template-columns: 1fr;
  }
}

/* ---- Cards (flat, strict) ----------------------------------------------- */

.he-card,
.he-step {
  position: relative;
  display: block;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  padding: 28px;
  height: 100%;
  transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.24s ease, transform 0.24s ease;
}

.he-card:hover {
  border-color: var(--vp-c-brand-1);
}

.he-step--visual-card {
  border-color: transparent;
  /* Transparent base shadow (alpha 0) with the same geometry as :hover so the
     brand glow fades in by alpha instead of popping from `none`. Dedicated,
     slightly longer transition makes the appearance clearly readable. */
  box-shadow:
    0 22px 54px rgba(84, 104, 255, 0),
    0 10px 26px rgba(168, 85, 247, 0);
  transition: border-color 0.2s ease, box-shadow 0.32s ease, transform 0.32s ease;
}

.he-step--visual-card:hover,
.he-step--visual-card:focus-within {
  border-color: transparent;
  box-shadow:
    0 22px 54px rgba(84, 104, 255, 0.32),
    0 10px 26px rgba(168, 85, 247, 0.24);
  transform: translateY(-6px);
}

.dark .he-step--visual-card:hover,
.dark .he-step--visual-card:focus-within {
  border-color: transparent;
  box-shadow:
    0 22px 54px rgba(84, 104, 255, 0.6),
    0 10px 26px rgba(168, 85, 247, 0.45);
}

.he-card--link {
  text-decoration: none;
  color: inherit;
}

.he-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
  margin-bottom: 18px;
}

.he-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-weight: 700;
  font-size: 15px;
  margin-bottom: 16px;
}

.he-step-visual {
  position: relative;
  isolation: isolate;
  width: 100%;
  aspect-ratio: 13 / 10;
  margin: -8px 0 22px;
}

.he-step-visual::before {
  content: "";
  position: absolute;
  z-index: -1;
  inset: 17% 7% 4%;
  border-radius: 999px;
  background:
    radial-gradient(ellipse at center, rgba(132, 74, 255, 0.34), transparent 68%),
    radial-gradient(ellipse at center, rgba(236, 72, 153, 0.2), transparent 74%);
  filter: blur(26px);
  opacity: 0.35;
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.he-step-image {
  display: block;
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: opacity 0.24s ease, transform 0.24s ease, filter 0.24s ease;
}

.he-step-image--blueprint {
  opacity: 1;
  filter: saturate(0.88) contrast(1.05);
}

.he-step-image--color {
  opacity: 0;
  transform: translateY(4px) scale(0.985);
}

.he-step:hover .he-step-visual::before {
  opacity: 1;
  transform: scale(1.04);
}

.he-step:hover .he-step-image--blueprint {
  opacity: 0;
  transform: translateY(-2px) scale(1.01);
}

.he-step:hover .he-step-image--color {
  opacity: 1;
  transform: translateY(0) scale(1);
}

@media (prefers-reduced-motion: reduce) {
  .he-step--visual-card,
  .he-step-visual::before,
  .he-step-image {
    transition: none;
  }
}

.he-badge {
  display: inline-block;
  margin-bottom: 14px;
  padding: 4px 11px;
  border-radius: 7px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 13px;
  font-weight: 600;
}

.he-card-title {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  margin: 0 0 10px;
  border: 0;
  padding: 0;
  letter-spacing: -0.01em;
}

.he-card-text {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1.65;
}

.he-points {
  list-style: none;
  margin: 18px 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.he-points li {
  padding: 5px 11px;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  font-size: 12px;
  line-height: 1.4;
}

.he-cta {
  display: inline-block;
  margin-top: 18px;
  color: var(--vp-c-brand-1);
  font-size: 14px;
  font-weight: 600;
  transition: transform 0.2s ease;
}

.he-card--link:hover .he-cta {
  transform: translateX(4px);
}

/* ---- Closing CTA --------------------------------------------------------- */

.he-cta-band {
  margin: 72px 0 88px;
  padding: 48px 32px;
  text-align: center;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  background: var(--vp-c-bg-soft);
}

.he-cta-title {
  font-size: clamp(1.5rem, 3vw, 2.1rem);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.2;
  border: 0;
  padding: 0;
  margin: 0;
  color: var(--vp-c-text-1);
}

.he-cta-sub {
  margin: 12px auto 0;
  max-width: 480px;
  color: var(--vp-c-text-2);
  font-size: 15px;
  line-height: 1.6;
}

.he-cta-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-top: 26px;
}

.he-btn {
  display: inline-flex;
  align-items: center;
  height: 44px;
  padding: 0 22px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
}

.he-btn--brand {
  /* Solid brand indigo in both themes (matches the hero button) — not the pale
     --vp-c-brand-1 ramp that dark mode uses for text accents. */
  background: var(--vp-button-brand-bg);
  color: #fff;
}

.he-btn--brand:hover {
  background: var(--vp-button-brand-hover-bg);
  transform: translateY(-2px);
}

.he-btn--ghost {
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
}

.he-btn--ghost:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
}

/* ---- Scroll reveal ------------------------------------------------------- */

.he-reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s ease, transform 0.6s ease;
  transition-delay: var(--he-delay, 0ms);
}

.he-reveal.he-in {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .he-reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
