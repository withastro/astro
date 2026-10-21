---
'astro': patch
---

Fixes `i18n.fallback` for on-demand pages. Requesting a localized URL that only exists in the fallback locale returned the page with a `302` status and no `Location` header. It now rewrites to the fallback page or redirects to it, depending on `i18n.routing.fallbackType`.
