---
'astro': major
---

Removes `entryPoints` on `astro:build:ssr` hook (Integration API)

In Astro 5.0, `functionPerRoute` was deprecated. That meant that `entryPoints` on the `astro:build:ssr` hook was always empty. Astro integrations may have continued to work, even while `entryPoints` was not providing any useful data.

Astro 6.0 removes the `entryPoints` map passed to this hook entirely. Integrations may no longer include `entryPoints`.

#### What should I do?

Remove any instance of `entryPoints` passed to `astro:build:ssr`. This should be safe to remove because this logic was not providing any useful data, but you may need to restructure your code accordingly for its removal:

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
