---
'astro': patch
---

Fixes CSS Module HMR in dev when a component is rendered both with and without hydration on the same page. Astro now uses path-based class name hashing in dev mode so that editing CSS declarations no longer changes the generated selectors, allowing Vite's CSS HMR to update styles without a full page reload.
