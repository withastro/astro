---
'astro': major
'@astrojs/markdown-remark': major
'@astrojs/mdx': minor
---

Give remark and rehype plugins access to user frontmatter via frontmatter injection. This means `data.astro.frontmatter` is now the _complete_ Markdown or MDX document's frontmatter, rather than an empty object.

This allows plugin authors to modify existing frontmatter, or compute new properties based on other properties. For example, say you want to compute a full image URL based on an `imageSrc` slug in your document frontmatter:

```ts
export function remarkInjectSocialImagePlugin() {
  return function (tree, file) {
    const { frontmatter } = file.data.astro;
    frontmatter.socialImageSrc = new URL(
      frontmatter.imageSrc,
      'https://my-blog.com/',
    ).pathname;
  }
}
```

## Content Collections - new `remarkPluginFrontmatter` property

We have changed _inject_ frontmatter to _modify_ frontmatter in our docs to improve discoverability. This is based on support forum feedback, where "injection" is rarely the term used.

To reflect this, the `injectedFrontmatter` property has been renamed to `remarkPluginFrontmatter`. This should clarify this plugin is still separate from the `data` export Content Collections expose today.


## Migration instructions

Plugin authors should now **check for user frontmatter when applying defaults.**

For example, say a remark plugin wants to apply a default `title` if none is present. Add a conditional to check if the property is present, and update if none exists:

```diff
export function remarkInjectTitlePlugin() {
  return function (tree, file) {
    const { frontmatter } = file.data.astro;
+    if (!frontmatter.title) {
      frontmatter.title = 'Default title';
+    }
  }
}
```

This differs from previous behavior, where a Markdown file's frontmatter would _always_ override frontmatter injected via remark or reype.
