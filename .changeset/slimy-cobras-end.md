---
"@astrojs/mdx": major
---

Allows integrations after the MDX integration to update `markdown.remarkPlugins` and `markdown.rehypePlugins`, and have the plugins work in MDX too.

If you rely on the ordering before to not add remark/rehype plugins for MDX, you need to configure `@astrojs/mdx` with `extendMarkdownConfig: false` and explicitly specify the `remarkPlugins` and `rehypePlugins` options instead.
