---
'astro': patch
---

Fixes a bug where Astro added quotes to the CSP resources.

Only certain resources require quotes (e.g. `'self'` but not `https://cdn.example.com`), so Astro no longer adds quotes to any resources. You must now provide the quotes yourself for resources such as `'self'` when necessary:

```diff
export default defineConfig({
  experimental: {
    csp: {
      styleDirective: {
        resources: [
-          "self",
+          "'self'",
          "https://cdn.example.com"
        ]
      }
    }
  }
})
```
