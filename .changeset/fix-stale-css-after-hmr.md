---
'astro': patch
---

Fixes an issue where editing CSS during dev would cause the inline `<style>` tags (used for anti-FOUC) to serve stale content on the next page load. This could trigger unexpected CSS transitions when the old and new CSS values differed on animatable properties.

The fix ensures that when style modules are updated via HMR, the SSR module graph is properly invalidated so the next page render picks up fresh CSS content.
