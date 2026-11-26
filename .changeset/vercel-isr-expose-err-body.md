---
'@astrojs/vercel': minor
---

Adds an `isr.exposeErrBody` option that writes `exposeErrBody` to the ISR prerender configuration, so Vercel serves error responses rendered by Astro (such as a custom `500` page) instead of replacing them with its own error page
