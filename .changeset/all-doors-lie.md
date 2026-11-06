---
'@astrojs/markdown-remark': patch
---

Fixes MDX `optimize` output for raw HTML from remark/rehype plugins. `<script>`/`<style>` content nested in static HTML is no longer emptied into a `set:html` attribute, and inline SVG keeps attribute names like `marker-end`.
