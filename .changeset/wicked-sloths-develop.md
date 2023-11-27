---
'astro': major
---

Removes deprecated features from Astro 3.0

- Adapters are now required to pass `supportedAstroFeatures` to specify a list of features they support.
- The `build.split` and `build.excludeMiddleware` options are removed. Use `functionPerRoute` and `edgeMiddleware` from adapters instead.
- The `markdown.drafts` option and draft feature is removed. Use content collections instead.
- Lowercase endpoint names are no longer supported. Use uppercase endpoint names instead.
- `getHeaders()` exported from markdown files is removed. Use `getHeadings()` instead.
