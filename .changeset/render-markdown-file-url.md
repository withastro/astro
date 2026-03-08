---
'astro': minor
---

Adds a `fileURL` option to `renderMarkdown` in content loaders, enabling resolution of relative image paths. When provided, relative image paths in markdown will be resolved relative to the specified file URL and included in `metadata.localImagePaths`.

```js
const loader = {
  name: 'my-loader',
  load: async ({ store, renderMarkdown }) => {
    const content = `
# My Post

![Local image](./image.png)
`;
    // Provide a fileURL to resolve relative image paths
    const fileURL = new URL('./posts/my-post.md', import.meta.url);
    const rendered = await renderMarkdown(content, { fileURL });
    // rendered.metadata.localImagePaths now contains the resolved image path
  }
};
```
