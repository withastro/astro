---
'@astrojs/netlify': minor
'@astrojs/vercel': minor
'@astrojs/node': minor
'astro': minor
---

Astro CSP is now stable. If you were already using the feature during the experimental period, you'll have to update the configuration:

```diff
export default defineConfig({
_  experimental: {
+  security: {
    csp: true
  }
})
```
