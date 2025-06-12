---
'astro': patch
---

**BREAKING CHANGE to the experimental feature CSP only**

Astro **won't** add apostrophes to the hashes anymore, which means that user-provided hash must contain them:

```diff
// astro.config.mjs

export default defineConfig({
  experimental: {
    csp: {
      styleDirective: {
        hashes: [
-          "sha256-hashvalue"
+          "'sha256-hashvalue'"
        ]
      },
      scriptDirective: {
        hashes: [
-          "sha256-hashvalue"
+          "'sha256-hashvalue'"
        ]
      }      
    }
  }
})
```

```diff
- Astro.insertStyleHash("sha256-hashvalue")
+ Astro.insertStyleHash("'sha256-hashvalue'")
```

```diff
- Astro.insertScriptHash("sha256-hashvalue")
+ Astro.insertScriptHash("'sha256-hashvalue'")
```
