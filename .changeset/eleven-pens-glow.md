---
'astro': minor
---

Deprecates exporting `prerender` with dynamic values. Only static values are supported by default. This allows for better treeshaking and bundling configuration in the future.

To migrate, use an integration with the `"astro:config:setup"` hook and update the route's prerender option with the `handleRouteOptions()` API:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [setPrerender()],
});

function setPrerender() {
  return {
    name: 'set-prerender',
    hooks: {
      'astro:config:setup': ({ handleRouteOptions }) => {
        handleRouteOptions((route) => {
          if (route.component.endsWith('/blog/[slug].astro')) {
            route.prerender = true;
          }
        });
      },
    },
  };
}
```
