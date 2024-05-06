---
"@astrojs/mdx": major
---

Allows integrations after the MDX integration to update `markdown.remarkPlugins` and `markdown.rehypePlugins`, and have the plugins work in MDX too.

If your integration relies on Astro's previous behavior that prevents integrations from adding remark/rehype plugins for MDX, you will now need to configure `@astrojs/mdx` with `extendMarkdownConfig: false` and explicitly specify any `remarkPlugins` and `rehypePlugins` options instead.
