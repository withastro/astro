---
'astro': patch
---

Fixes a bug where `compressHTML: true` inserted a spurious space before punctuation adjacent to a component's closing tag when the component contained a `<script>` block
