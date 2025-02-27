---
'astro': patch
---

Adds experimental responsive image support in Markdown

Previously, the `experimental.responsiveImages` feature could only provide responsive images when using the `<Image />` and `<Picture />` components.

Now, images written with the `![]()` Markdown syntax in Markdown and MDX files will generate responsive images by default when using this experimental feature.

To try this experimental feature, set `experimental.responsiveImages` to true in your `astro.config.mjs` file:

```js
{
   experimental: {
      responsiveImages: true,
   },
}
```

Learn more about using this feature in the [experimental responsive images feature reference](https://docs.astro.build/en/reference/experimental-flags/responsive-images/).

For a complete overview, and to give feedback on this experimental API, see the [Responsive Images RFC](https://github.com/withastro/roadmap/blob/responsive-images/proposals/0053-responsive-images.md).