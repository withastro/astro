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
		cacheKey: post.digest,
	}));
}
---
```

For incremental builds to skip rendering in CI, Astro's cache directory must be preserved between builds. Astro empties the output directory on each build and restores skipped pages from the cache directory, so only that directory needs to persist. For the default config, cache and restore `node_modules/.astro/` before running `astro build`.

See the [experimental incremental static builds](https://docs.astro.build/en/reference/experimental-flags/incremental-build/) documentation for more information.
