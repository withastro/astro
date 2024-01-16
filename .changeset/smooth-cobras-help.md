---
'astro': minor
---

Adds an experimental flag `stableRoutePriority` to make all routes be prioritized following the same stable rules.

```js
// astro.config.mjs
export default defineConfig({
  experimental: {
    globalRoutePriority: true,
  },
})
```

Enabling this feature makes redirects and injected routes be prioritized along with discovered file-based project
routes, behaving the same as if all routes were defined as files in the project.

For the following scenario in SSR mode:

- File-based route: `/blog/post/[pid]`
- File-based route: `/[page]`
- Injected route: `/blog/[...slug]`
- Redirect: `/blog/tags/[tag]` -> `/[tag]`
- Redirect: `/posts` -> `/blog`

URLs are handled with the following routes:

| Page               | Current Behavior                 | Global Routing Priority Behavior   |
|--------------------|----------------------------------|------------------------------------|
| `/blog/tags/astro` | Injected route `/blog/[...slug]` | Redirect to `/tags/[tag]`          |
| `/blog/post/0`     | Injected route `/blog/[...slug]` | File-based route `/blog/post/[pid] |
| `/posts`           | File-based route `/[page]`       | Redirect to `/blog`                |

