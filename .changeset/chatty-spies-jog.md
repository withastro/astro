---
'astro': patch
---

Avoids targeting all files in the `src/` directory for eager optimization by Vite. After this change, only JSX, Vue, Svelte, and Astro components get scanned for early optimization.
