---
'astro': patch
---

Fixes UnoCSS `@apply` and `--at-apply` directive styles breaking after soft navigation with ClientRouter in dev mode.

The dev CSS cache plugin now runs after integration plugins (like UnoCSS) in the Vite transform pipeline, ensuring it caches fully-processed CSS instead of raw unresolved directives.
