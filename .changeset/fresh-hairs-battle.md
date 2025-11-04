---
'@astrojs/preact': patch
'@astrojs/svelte': patch
'@astrojs/react': patch
'@astrojs/solid-js': patch
'@astrojs/mdx': patch
'@astrojs/vue': patch
'astro': patch
---

Adds support for client hydration in `getContainerRenderer()`

The `getContainerRenderer()` function is exported by Astro framework integrations to simplify the process of rendering framework components when using the experimental Container API inside a Vite or Vitest environment. This update adds the client hydration entrypoint to the returned object, enabling client-side interactivity for components rendered using this function. Previously this required users to manually call `container.addClientRenderer()` with the appropriate client renderer entrypoint.

See [the `container-with-vitest` demo](https://github.com/withastro/astro/blob/main/examples/container-with-vitest/test/ReactWrapper.test.ts) for a usage example, and [the Container API documentation](https://docs.astro.build/en/reference/container-reference/#renderers-option) for more information on using framework components with the experimental Container API.
