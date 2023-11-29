---
'astro': patch
---

The configuration `i18n.routingStrategy` has been replaced with an object called `routing`.

```diff
export default defineConfig({
  experimental: {
      i18n: {
-          routingStrategy: "prefix-always",
+          routing: {
+              prefixDefaultLocale: true,
+          }  
      }
  }
})
```

```diff
export default defineConfig({
  experimental: {
      i18n: {
-          routingStrategy: "prefix-other-locales",
+          routing: {
+              prefixDefaultLocale: false,
+          }  
      }
  }
})
```
