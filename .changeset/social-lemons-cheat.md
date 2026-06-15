---
'astro': minor
---

Adds experimental support for incremental static builds with `experimental.incrementalBuild`.

When enabled, Astro can skip regenerating static pages from dynamic routes when both the page's module dependencies and its data cache key are unchanged from the previous build. This currently applies to pages returned from `getStaticPaths()` that include a `cacheKey`.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
	experimental: {
		incrementalBuild: true,
	},
});
```

Return a `cacheKey` for each generated page from `getStaticPaths()`:

```astro
---
export async function getStaticPaths() {
	const posts = await fetchPosts();

	return posts.map((post) => ({
		params: { slug: post.slug },
		props: { post },
		cacheKey: post.updatedAt,
	}));
}
---
```

For incremental builds to skip rendering in CI, both Astro's cache directory and the previous build output must be preserved between builds. For the default config, cache `node_modules/.astro/` and restore/cache `dist/` before running `astro build`.
