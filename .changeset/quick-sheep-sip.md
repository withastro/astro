---
'astro': patch
---

Fixes a bug where pages importing `astro:i18n` received CSS and scripts belonging to `client:only` components, hydrated components, and `<script>` tags of other pages in the build
