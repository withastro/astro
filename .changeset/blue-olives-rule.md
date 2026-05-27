---
'astro': patch
---

Fixes `X-Forwarded-Host` and `X-Forwarded-Proto` headers being ignored when set in a custom `src/app.ts` fetch handler before creating `FetchState`
