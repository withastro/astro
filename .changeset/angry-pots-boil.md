---
'astro': patch
'@astrojs/mdx': patch
'@astrojs/markdown-remark': patch
---

Add SmartyPants back to Astro's default Markdown and MDX plugins. This can be disabled using the `markdown.smartypants` config option:

```js
{
  markdown: {
    smartypants: false,
  }
}
```
