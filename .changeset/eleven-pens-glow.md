---
'astro': minor
---

Deprecates exporting `prerender` with dynamic values. Only static values are supported by default. This allows for better treeshaking and bundling configuration in the future.

To migrate, use an integration with the `"astro:route:setup"` hook and update the route's `prerender` option:

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
      'astro:route:setup': ({ route }) => {
        if (route.component.endsWith('/blog/[slug].astro')) {
          route.prerender = true;
        }
      },
    },
  };
}
```
