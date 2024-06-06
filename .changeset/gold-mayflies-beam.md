---
"astro": patch
---

**BREAKING CHANGE to the experimental Container API only** 

Changes the **type** of the `renderers` option of the `AstroContainer::create` function and adds a dedicated function `loadRenderers()` to load the rendering scripts from renderer integration packages (`@astrojs/react`, `@astrojs/preact`, `@astrojs/solid-js`, `@astrojs/svelte`, `@astrojs/vue`, `@astrojs/lit`, and `@astrojs/mdx`).

You no longer need to know the individual, direct file paths to the client and server rendering scripts for each renderer integration package. Now, there is a dedicated function to load the renderer from each package, which is available from `getContainerRenderer()`:

```diff
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ReactWrapper from '../src/components/ReactWrapper.astro';
import { loadRenderers } from "astro:container";
import { getContainerRenderer } from "@astrojs/react";

test('ReactWrapper with react renderer', async () => {
+ const renderers = await loadRenderers([getContainerRenderer()])
- const renderers = [
- {
-  name: '@astrojs/react',
-   clientEntrypoint: '@astrojs/react/client.js',
-   serverEntrypoint: '@astrojs/react/server.js',
-  },
- ];
  const container = await AstroContainer.create({
    renderers,
  });
  const result = await container.renderToString(ReactWrapper);

  expect(result).toContain('Counter');
  expect(result).toContain('Count: <!-- -->5');
});
```

The new `loadRenderers()` helper function is available from `astro:container`,  a virtual module that can be used when running the Astro container inside `vite`.
