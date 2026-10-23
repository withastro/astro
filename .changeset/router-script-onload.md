---
'astro': patch
---

Fixes client-side navigation with `<ClientRouter />` to a page with a `<script>` that has both a `src` and an `onload` or `onerror` attribute. Depending on attribute order, either that handler never ran or `astro:page-load` never fired.
