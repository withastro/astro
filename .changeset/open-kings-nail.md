---
'astro': patch
'@astrojs/markdown-remark': patch
'@astrojs/markdown-satteri': patch
---

Fixes `<script>`/`<style>` rendering in MDX so that only literal content (including content injected by remark/rehype plugins) is treated as trusted markup. A dynamic value passed as a `<script>`/`<style>` child (e.g. `<script>{value}</script>`) is now escaped like any other element's content instead of being rendered raw. Use `set:html` to explicitly opt a dynamic value back into raw rendering.

