---
'astro': minor
---

Widens the `AstroPrerenderer` `render()` return type so prerenderers can report incremental-build metadata

A prerenderer's `render()` may now resolve to either a `Response` (as before) or a `PrerenderResult` object that pairs the response with the content entries and optimized-image transforms the page resolved. This lets prerenderers that render out of process (for example, in an adapter's runtime like workerd) report those dependencies back to the build, so [incremental static builds](https://docs.astro.build/en/reference/experimental-flags/incremental-build/) can track and replay them for skipped pages.

```ts
import type { AstroPrerenderer, PrerenderResult } from 'astro';

const prerenderer: AstroPrerenderer = {
	name: 'my-adapter:prerenderer',
	getStaticPaths,
	async render(request, { routeData }): Promise<PrerenderResult> {
		const { response, metadata } = await renderInRuntime(request, routeData);
		return { response, metadata };
	},
};
```

This is a non-breaking widening: prerenderers that return a bare `Response` continue to work unchanged, and in-process prerenderers can keep returning a `Response` since the build collects their metadata directly.
