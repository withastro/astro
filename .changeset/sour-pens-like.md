---
'astro': patch
---

Fixes style-only HMR in `.astro` components falling back to a full page reload when a PostCSS plugin (such as `@unocss/postcss`) lists the component as a dependency of its own style
