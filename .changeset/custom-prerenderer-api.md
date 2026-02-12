---
'astro': minor
---

Updates the Integration API to add `setPrerenderer()` to the `astro:build:start` hook, allowing adapters to provide custom prerendering logic.

The new API accepts either an `AstroPrerenderer` object directly, or a factory function that receives the default prerenderer:

```js
'astro:build:start': ({ setPrerenderer }) => {
  setPrerenderer((defaultPrerenderer) => ({
    name: 'my-prerenderer',
    async setup() {
      // Optional: called once before prerendering starts
    },
    async getStaticPaths() {
      // Returns array of { pathname: string, route: RouteData }
      return defaultPrerenderer.getStaticPaths();
    },
    async render(request, { routeData }) {
      // request: Request
      // routeData: RouteData
      // Returns: Response
    },
    async teardown() {
      // Optional: called after all pages are prerendered
    }
  }));
}
```

Also adds the `astro:static-paths` virtual module, which exports a `StaticPaths` class for adapters to collect all prerenderable paths from within their target runtime. This is useful when implementing a custom prerenderer that runs in a non-Node environment:

```js
// In your adapter's request handler (running in target runtime)
import { App } from 'astro/app';
import { StaticPaths } from 'astro:static-paths';

export function createApp(manifest) {
  const app = new App(manifest);
  
  return {
    async fetch(request) {
      const { pathname } = new URL(request.url);
      
      // Expose endpoint for prerenderer to get static paths
      if (pathname === '/__astro_static_paths') {
        const staticPaths = new StaticPaths(app);
        const paths = await staticPaths.getAll();
        return new Response(JSON.stringify({ paths }));
      }
      
      // Normal request handling
      return app.render(request);
    }
  };
}
```

See the [adapter reference](https://v6.docs.astro.build/en/reference/adapter-reference/#custom-prerenderer) for more details on implementing a custom prerenderer.

