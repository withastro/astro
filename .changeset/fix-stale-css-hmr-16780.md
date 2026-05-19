---
'astro': patch
---

Fixes stale inline CSS in server-rendered HTML after CSS file edits during dev

When editing a CSS file (`.css`, `.scss`, etc.) during development, the inline `<style>` tags in server-rendered HTML would retain old CSS content instead of updating. This caused a brief flash of old CSS (FOUC) on fresh page loads before Vite's client-side HMR corrected the styles.

The fix ensures that Astro's per-route dev CSS virtual modules are invalidated in both the SSR module graph and the module runner's evaluation cache when a style file changes, so the next page render picks up the fresh CSS.
