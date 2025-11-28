---
'astro': major
---

**Vite Environments API breaking changes:** Build configuration and dev server interactions now use Vite's new Environments API.

**Changes:**
- `astro:build:setup` hook is now called once with all environments configured (`ssr`, `client`, `prerender`) instead of being called separately for each build target
- Dev server HMR changed from `server.hot.send()` to `server.environments.client.hot.send()`
- Dev toolbar and integration code accessing HMR must use the new Vite Environments API

**Example: Updating astro:build:setup**

Before, you could check the `target` parameter to apply different config:
```ts
{
  hooks: {
    'astro:build:setup': ({ target, vite }) => {
      if (target === 'client') {
        vite.build.minify = false;
      }
    }
  }
}
```

Now, use `vite.environments` to configure specific environments:
```ts
{
  hooks: {
    'astro:build:setup': ({ vite }) => {
      vite.environments.client.build.minify = false;
    }
  }
}
```
