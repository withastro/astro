---
'@astrojs/vercel': minor
---

You can now configure how long your functions can run before timing out.

```diff
export default defineConfig({
    output: "server",
    adapter: vercel({
+       maxDuration: 60
    }),
});
```
