---
'@astrojs/vue': patch
---

Fixes slow server rendering of Vue components that receive slot content from Astro, which was being concatenated character by character during SSR
