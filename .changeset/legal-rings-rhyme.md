---
'@astrojs/markdown-remark': minor
---

Updates `createMarkdownProcessor` to support advanced SmartyPants options.

The `smartypants` property in `AstroMarkdownOptions` now accepts a `SmartypantsOptions` object, allowing fine-grained control over typography transformations (backticks, dashes, ellipses, and quotes).

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
