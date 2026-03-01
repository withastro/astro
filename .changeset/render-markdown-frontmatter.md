---
'astro': major
---

Adds frontmatter parsing support to `renderMarkdown` in content loaders. When markdown content includes frontmatter, it is now extracted and available in `metadata.frontmatter`, and excluded from the HTML output. This makes `renderMarkdown` behave consistently with the `glob` loader.

```js
const loader = {
  name: 'my-loader',
  load: async ({ store, renderMarkdown }) => {
    const content = `---
title: My Post
---

# Hello World
`;
    const rendered = await renderMarkdown(content);
    // rendered.metadata.frontmatter is now { title: 'My Post' }
    // rendered.html contains only the content, not the frontmatter
  }
};
```
