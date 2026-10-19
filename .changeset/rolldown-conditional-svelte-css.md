---
'astro': patch
---

Fixes missing styles in production builds for conditionally rendered framework components (e.g. Svelte components inside `{#if}` blocks) imported by a hydrated island
