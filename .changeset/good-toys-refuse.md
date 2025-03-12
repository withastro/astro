---
'@astrojs/markdoc': minor
'@astrojs/mdx': minor
'@astrojs/markdown-remark': minor
'astro': minor
---

Adds support for a new `experimental.headingIdCompat` flag

By default, Astro removes a trailing `-` from the end of IDs it generates for headings ending with
special characters. This differs from the behavior of common Markdown processors.

You can now disable this behavior with a new configuration flag:

```js
// astro.config.mjs
import { defineConfig } from "astro/config";

export default defineConfig({
  experimental: {
    headingIdCompat: true,
  },
});
```

This can be useful when heading IDs and anchor links need to behave consistently across your site
and other platforms such as GitHub and npm.

If you are [using the `rehypeHeadingIds` plugin directly](https://docs.astro.build/en/guides/markdown-content/#heading-ids-and-plugins), you can also pass this new option:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import { rehypeHeadingIds } from '@astrojs/markdown-remark';
import { otherPluginThatReliesOnHeadingIDs } from 'some/plugin/source';

export default defineConfig({
  markdown: {
    rehypePlugins: [
      [rehypeHeadingIds, { experimentalHeadingIdCompat: true }],
      otherPluginThatReliesOnHeadingIDs,
    ],
  },
});
```
