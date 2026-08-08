---
'astro': patch
---

Fixes XSS by escaping `</script>` and `</style>` sequences in raw string children of `<script>` and `<style>` elements
