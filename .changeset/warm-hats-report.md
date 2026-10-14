---
'astro': minor
---

Lets custom prerenderers report the images used on prerendered pages

Astro now generates images on prerendered pages from the image information that a prerenderer's `getStaticPaths()` and `render()` return. If your prerenderer wraps Astro's default one, pass this information through:

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
