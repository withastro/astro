---
'astro': patch
---

Fixes a `content-security-policy` header being sent in `astro dev` when the adapter handles CSP headers (for example `staticHeaders: true`), which blocked the styles Vite injects
