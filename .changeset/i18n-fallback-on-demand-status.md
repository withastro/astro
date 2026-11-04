---
'astro': patch
---

Fixes i18n fallback for on-demand rendered pages. A locale-prefixed request for a page that only exists in the fallback locale (for example `/de/about` with `fallback: { de: 'en' }`) was answered with status `302` and no `Location` header. Such requests are now rewritten or redirected to the fallback locale according to `i18n.routing.fallbackType`, including encoded paths and sites with a configured `base`. Query strings are preserved, and explicit page statuses and redirects are left unchanged.
