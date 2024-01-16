---
'astro': minor
---

Adds an experimental flag `globalRoutePriority` to prioritize redirects and injected routes equally alongside file-based project routes, following the same [route priority order rules](https://docs.astro.build/en/core-concepts/routing/#route-priority-order) for all routes.

```js
// astro.config.mjs
export default defineConfig({
  experimental: {
    globalRoutePriority: true,
  },
})
```

Enabling this feature ensures that all routes in your project follow the same, predictable route priority order rules. In particular, this avoids an issue where redirects or injected routes (e.g. from an integration) would always take precedence over locally-defined route definitions, making it impossible to override some routes locally.

The following table shows which route builds certain page URLs when file-based routes, injected routes, and redirects are combined as shown below:

- File-based route: `/blog/post/[pid]`
- File-based route: `/[page]`
- Injected route: `/blog/[...slug]`
- Redirect: `/blog/tags/[tag]` -> `/[tag]`
- Redirect: `/posts` -> `/blog`

URLs are handled by the following routes:

| Page               | Current Behavior                 | Global Routing Priority Behavior   |
|--------------------|----------------------------------|------------------------------------|
| `/blog/tags/astro` | Injected route `/blog/[...slug]` | Redirect to `/tags/[tag]`          |
| `/blog/post/0`     | Injected route `/blog/[...slug]` | File-based route `/blog/post/[pid]` |
| `/posts`           | File-based route `/[page]`       | Redirect to `/blog`                |

