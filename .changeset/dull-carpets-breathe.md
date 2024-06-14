---
'astro': patch
'@astrojs/preact': minor
'@astrojs/svelte': minor
'@astrojs/react': minor
'@astrojs/solid-js': minor
'@astrojs/lit': minor
'@astrojs/vue': minor
---

Adds a new function called `addServerRenderer` to the Container API. Use this function to manually store renderers inside the instance of your container.

This new function should be preferred when using the Container API in environments like on-demand pages:

```ts
import type {APIRoute} from "astro";
import { experimental_AstroContainer } from "astro/container";
import reactRenderer from '@astrojs/react/server.js';
import vueRenderer from '@astrojs/vue/server.js';
import ReactComponent from "../components/button.jsx"
import VueComponent from "../components/button.vue"

// MDX runtime is contained inside the Astro core
import mdxRenderer from "astro/jsx/server.js"

// In case you need to import a custom renderer
import customRenderer from "../renderers/customRenderer.js";

export const GET: APIRoute = async (ctx) => {
  const container = await experimental_AstroContainer.create();
  container.addServerRenderer({ renderer: reactRenderer });
  container.addServerRenderer({ renderer: vueRenderer });
  container.addServerRenderer({ renderer: customRenderer });
  // You can pass a custom name too
  container.addServerRenderer({ 
    name: "customRenderer",
    renderer: customRenderer
  })
  const vueComponent = await container.renderToString(VueComponent)
  return await container.renderToResponse(Component);
}
```
