---
'astro': patch
---

Fixes a build error where using `astro:config/client` inside a `<script>` tag would cause Rollup to fail with "failed to resolve import `virtual:astro:routes` from `virtual:astro:manifest`"
