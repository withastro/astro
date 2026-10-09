---
'astro': minor
---

Adds image metadata to the custom prerenderer API

Images are now generated from the metadata that `getStaticPaths()` and `render()` return. A prerenderer wrapping Astro's default one should pass the metadata through:

```js
setPrerenderer((defaultPrerenderer) => ({
  name: 'my-prerenderer',
  async setup() {
    await defaultPrerenderer.setup?.();
  },
  async getStaticPaths() {
    const result = await defaultPrerenderer.getStaticPaths();
    const { paths, metadata } = Array.isArray(result) ? { paths: result } : result;
    return { paths: paths.filter(({ pathname }) => !pathname.startsWith('/drafts')), metadata };
  },
  render(request, options) {
    return defaultPrerenderer.render(request, options);
  },
  async teardown() {
    await defaultPrerenderer.teardown?.();
  },
}));
```

Returning a plain array from `getStaticPaths()` or a plain `Response` from `render()` still works, but is deprecated: images used on those pages are not generated.
