---
'@astrojs/vue': patch
---

Fixes Vue SSR concatenating Astro slot HTML character by character when the slot value is a String object (Astro's SlotString). StaticHtml now coerces the value with `String(...)` before passing it to `innerHTML`.
