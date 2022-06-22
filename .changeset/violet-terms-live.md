---
'astro': patch
---

Inlines small hoisted scripts

This enables a perf improvement, whereby small hoisted scripts without dependencies are inlined into the HTML, rather than loaded externally. This uses `vite.build.assetInlineLimit` to determine if the script should be inlined.
