---
'astro': minor
---

Adds support for advanced configuration of SmartyPants in Markdown.

You can now pass an options object to `markdown.smartypants` in your Astro configuration to fine-tune how punctuation, dashes, and quotes are transformed.

This is helpful for projects that require specific typographic standards, such as "oldschool" dash handling or localized quotation marks.

```js
// astro.config.mjs
export default defineConfig({
  markdown: {
    smartypants: {
      backticks: 'all',
      dashes: 'oldschool',
      ellipses: 'unspaced',
      openingQuotes: { double: '«', single: '‹' },
      closingQuotes: { double: '»', single: '›' },
      quotes: false,
    },
  },
});
```

See [the `markdown.smartypants` reference documentation](https://docs.astro.build/en/reference/configuration-reference/#markdownsmartypants) for more information.
