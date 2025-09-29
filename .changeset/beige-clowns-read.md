---
'@astrojs/vercel': major
'astro': major
---

Removes `entryPoints` on `astro:build:ssr` hook (Integration API)

In Astro 5.0, `functionPerRoute` was deprecated. That meant that `entryPoints` on the `astro:build:ssr` hook was always empty.

Astro 6.0 removes the `entryPoints` map passed to this hook entirely.

#### What should I do?

Remove any instance of `entryPoints` passed to `astro:build:ssr`:

```diff
// my-integration.mjs
const integration = () => {
    return {
        name: 'my-integration',
        hooks: {
            'astro:build:ssr': (params) => {
-                someLogic(params.entryPoints)
            },
        }
    }
}
```
