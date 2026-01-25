---
'astro': minor
---

Adds `setPrerenderer()` to the `astro:build:start` hook, allowing adapters to provide custom prerendering logic.

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
    async render(request, routeData) {
      // request: Request - the request to render
      // routeData: RouteData - the route data for this request
      // Returns: Response
    },
    async teardown() {
      // Optional: called after all pages are prerendered
    }
  }));
}
```

Also adds the `astro:static-paths` virtual module, which exports a `StaticPaths` class for adapters to collect all prerenderable paths from within their target runtime.
