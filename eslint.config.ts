import antfu from '@antfu/eslint-config'

// Lint + formatting in one pass via @antfu/eslint-config (ESLint stylistic
// rules — no Prettier). Vue + TypeScript are auto-detected; generated output
// (dist, embed-dist, docs/api, …) is ignored through .gitignore.
export default antfu({
  vue: true,
  typescript: true,
  stylistic: {
    indent: 2,
    quotes: 'single',
    semi: false,
  },
  rules: {
    // kebab-case custom events are idiomatic in this codebase's templates.
    'vue/custom-event-name-casing': 'off',
    // `<script setup>` routinely defines handlers that reference composable
    // results declared lower in the block — safe, since they only run after
    // setup completes. Still flag genuine same-scope use-before-declaration.
    'ts/no-use-before-define': ['error', {
      functions: false,
      classes: false,
      variables: false,
      ignoreTypeReferences: true,
    }],
  },
})
