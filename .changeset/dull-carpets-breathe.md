---
'@astrojs/react': minor
---

Exposes a `renderer` object from `@astrojs/react/server.js` and `@astrojs/react/server17.js`. This is useful when using the Container API for on-demand pages:

```ts
import type {APIRoute, SSRLoadedRenderer} from "astro";
import { experimental_AstroContainer } from "astro/container";
import { renderer } from '@astrojs/react/server.js';
import Component from "../components/button.jsx"

export const GET: APIRoute = async (ctx) => {
  const renderers: SSRLoadedRenderer[] = [renderer];
  const container = await experimental_AstroContainer.create({
    renderers
  });
  return await container.renderToResponse(Component);
}
```
