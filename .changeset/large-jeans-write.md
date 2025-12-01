---
'astro': patch
---

Fixes a bug where Astro didn't deduplicate CSP resources. This would have resulted in grammatically incorrect CSP headers.

Now Astro correctly deduplicate CSP resources. For example, if you have a global resource in the configuration file, and then you add a 
a new one using the runtime APIs. 

```js
// astro.config.mjs
export default defineConfig({
  experimental: {
    csp: {
      directives: ["img-src https://global.cdn.example.org"]
    }
  }
})
```

```astro
---
// pages/index.astro
Astro.csp.insertDirective("img-src https://vendor.cdn.example.org")
---
```

Now Astro will generate a CSP header that will contain the following resource:
```
image-src https://global.cdn.example.org https://vendor.cdn.example.org
```
