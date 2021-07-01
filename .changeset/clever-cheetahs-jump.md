---
'astro': minor
'@astrojs/markdown-support': minor
---

Add support for [`remark`](https://github.com/remarkjs/remark#readme) and [`rehype`](https://github.com/rehypejs/rehype#readme) plugins for both `.md` pages and `.astro` pages using the [`<Markdown>`](/docs/guides/markdown-content.md) component.

For example, the `astro.config.mjs` could be updated to include the following. [Read the Markdown documentation](/docs/guides/markdown-content.md) for more information.

> **Note** Enabling custom `remarkPlugins` or `rehypePlugins` removes Astro's built-in support for [GitHub-flavored Markdown](https://github.github.com/gfm/) support, [Footnotes](https://github.com/remarkjs/remark-footnotes) syntax, [Smartypants](https://github.com/silvenon/remark-smartypants). You must explicitly add these plugins to your `astro.config.mjs` file, if desired.

```js
export default {
  markdownOptions: {
    remarkPlugins: [
      'remark-slug',
      ['remark-autolink-headings', { behavior: 'prepend'}],
    ],
    rehypePlugins: [
      'rehype-slug',
      ['rehype-autolink-headings', { behavior: 'prepend'}],
    ]
  },
}
```
