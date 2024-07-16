---
'astro': patch
---

Avoids targetting all files in `src` directory for eager optimization by Vite. After this change, only JSX, Vue, Svelte, and Astro components get scanned for early optimization.
