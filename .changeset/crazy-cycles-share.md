---
'@astrojs/vercel': minor
---

Adds `globalCsp` option to `experimentalStaticHeaders` for improved performance with large sites. When enabled, collapses all CSP headers to a single catch-all route instead of creating individual route entries per page.
