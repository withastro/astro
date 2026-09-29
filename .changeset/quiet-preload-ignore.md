---
'astro': patch
---

Fixes inlined `<script>` tags that contain a `/* @vite-ignore */` dynamic import shipping an unresolved `__VITE_PRELOAD__` marker
