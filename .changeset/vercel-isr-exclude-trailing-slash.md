---
'@astrojs/vercel': patch
---

Fixes `isr.exclude` not matching paths with a trailing slash. A request to an excluded path such as `/account/` could match a dynamic ISR route like `[slug]` instead, so the page was cached and served to every visitor.
