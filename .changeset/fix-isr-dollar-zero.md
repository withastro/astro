---
'@astrojs/vercel': patch
---

Fixes a rare issue where ISR pages on Vercel could intermittently be served a cached redirect to a nonsense URL (such as `/$0/`) instead of the page itself. Pages now render correctly, and requests that can't be resolved to a valid path return a `404` instead of a redirect.