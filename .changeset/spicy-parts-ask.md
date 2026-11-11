---
'@astrojs/markdown-remark': patch
'@astrojs/markdown-satteri': patch
---

Fixes MDX `optimize` emptying `<style>` and `<script>` elements nested in static HTML from plugins, and turning SVG attributes like `marker-end` into `markerEnd` when `ignoreElementNames` is set
