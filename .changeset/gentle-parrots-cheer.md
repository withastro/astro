---
'@astrojs/mdx': minor
---

Support rehype plugins that inject namespaced attributes. This introduces a breaking change if you use [custom components for HTML elements](https://docs.astro.build/en/guides/markdown-content/#assigning-custom-components-to-html-elements), where the prop passed to the component will be normal HTML casing, e.g. `class` instead of `className`, and `xlink:href` instead of `xlinkHref`.
