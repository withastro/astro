---
'astro': patch
---

Fixes a bug where Astro added quotes to the CSP resources. Now Astro doesn't add quotes to the resources, and the user must provide them.

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
