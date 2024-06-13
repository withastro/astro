---
'astro': patch
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

export const GET: APIRoute = async (ctx) => {
  const container = await experimental_AstroContainer.create();
  container.addServerRenderer("@astrojs/react", reactRenderer);
  container.addServerRenderer("@astrojs/vue", vueRenderer);
  const vueComponent = await container.renderToString(VueComponent)
  return await container.renderToResponse(Component);
}
```
