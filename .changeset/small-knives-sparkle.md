---
'astro': minor
---

Throw better error when a dynamic endpoint without additional extensions is prerendered with `undefined` params. For example, `src/pages/blog/[slug].js` and `src/pages/blog/[...slug].js` can't have a `getStaticPaths` function that returns `undefined` for `slug`, Astro would generate both a `/blog` file and `/blog` directory (for thruthy slugs), causing a build error. To fix this, you can add an extension like `[...slug].json.js` to generate `/blog.json` instead.
