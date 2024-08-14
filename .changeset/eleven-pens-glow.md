---
'astro': minor
---

Deprecates the option for route-generating files to export a dynamic value for `prerender`. Only static values are now supported (e.g. `export const prerender = true` or `= false`). This allows for better treeshaking and bundling configuration in the future.

Adds a new [`"astro:route:setup"` hook](https://docs.astro.build/en/reference/integrations-reference/#astroroutesetup) to the Integrations API to allow you to dynamically set options for a route at build or request time through an integration, such as enabling [on-demand server rendering](https://docs.astro.build/en/guides/server-side-rendering/#opting-in-to-pre-rendering-in-server-mode).

To migrate from a dynamic export to the new hook, update or remove any dynamic `prerender` exports from individual routing files:

```diff
// src/pages/blog/[slug].astro
- export const prerender = import.meta.env.PRERENDER
```

Instead, create an integration with the `"astro:route:setup"` hook and update the route's `prerender` option:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

export default defineConfig({
  integrations: [setPrerender()],
});

function setPrerender() {
  const { PRERENDER } = loadEnv(process.env.NODE_ENV, process.cwd(), '');

  return {
    name: 'set-prerender',
    hooks: {
      'astro:route:setup': ({ route }) => {
        if (route.component.endsWith('/blog/[slug].astro')) {
          route.prerender = PRERENDER;
        }
      },
    },
  };
}
```
