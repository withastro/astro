---
'astro': patch
---

`<style>` tags in components now follow the same rules as `<script>` tags, meaning that each page only includes the css of its imported components.

Previously, some cases involving complex import trees could break Astro's analysis of imported components. Now, the analysis is a bit more robust and should handle more of those cases.
