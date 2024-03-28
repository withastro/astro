---
"@astrojs/vercel": minor
---

The `isr.exclude` configuration can now include routes with dynamic and spread parameters.
```ts
export default defineConfig({
    adapter: vercel({
        isr: {
            exclude: [
                "/blog/[title]"
                "/api/[...slug]",
            ]
        }
    })
})
```
