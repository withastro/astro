---
'astro': patch
---

Fixes font flash (FOUT) during ClientRouter navigation by preserving inline `<style>` elements and font preload links in the head during page transitions.

Previously, `@font-face` declarations from the `<Font>` component were removed and re-inserted on every client-side navigation, causing the browser to re-evaluate them.
