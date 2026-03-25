---
'@astrojs/markdown-remark': minor
---

Updates `createMarkdownProcessor` to support advanced SmartyPants options.

The `smartypants` property in `AstroMarkdownOptions` now accepts `Smartypants` options, allowing fine-grained control over typography transformations (backticks, dashes, ellipses, and quotes).

```ts
import { createMarkdownProcessor } from '@astrojs/markdown-remark';

const processor = await createMarkdownProcessor({
  smartypants: {
    backticks: 'all',
    dashes: 'oldschool',
    ellipses: 'unspaced',
    openingQuotes: { double: '«', single: '‹' },
    closingQuotes: { double: '»', single: '›' },
    quotes: false,
  }
});
```

For the up-to-date supported properties, check out [the `retext-smartypants` options](https://github.com/retextjs/retext-smartypants?tab=readme-ov-file#fields).
