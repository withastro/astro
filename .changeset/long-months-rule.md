---
'astro': major
---

Deprecate Astro.glob

The `Astro.glob` function has been deprecated in favor of Content Collections and `import.meta.glob`.

- If you want to query for markdown and MDX in your project, use Content Collections.
- If you want to query source files in your project, use `import.meta.glob`(https://vitejs.dev/guide/features.html#glob-import).

Also consider using glob packages from npm, like [fast-glob](https://www.npmjs.com/package/fast-glob), especially if statically generating your site, as it is faster for most use-cases.

The easiest path is to migrate to `import.meta.glob` like so:

```diff
- const posts = Astro.glob('./posts/*.md');
+ const posts = Object.values(import.meta.glob('./posts/*.md', { eager: true }));
```
