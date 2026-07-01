---
'astro': patch
---

Fixes a regression where a `<script>` inside a component rendered through `Astro.slots.render()` was hoisted out of its original position instead of staying next to its component content
