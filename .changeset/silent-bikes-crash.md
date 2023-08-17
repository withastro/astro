---
'@astrojs/rss': patch
'astro': patch
---

Deprecate the `markdown.drafts` configuration option.

If you'd like to create draft pages that are visible in dev but not in production, you can [migrate to content collections](https://docs.astro.build/en/guides/content-collections/#migrating-from-file-based-routing) and [manually filter out pages](https://docs.astro.build/en/guides/content-collections/#filtering-collection-queries) with the `draft: true` frontmatter property instead.
