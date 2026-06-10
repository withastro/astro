---
'@astrojs/mdx': patch
---

Fixes a bug where `extendMarkdownConfig: false` did not prevent MDX from inheriting the global `markdown.processor`. MDX now correctly uses a fresh default processor with no plugins when `extendMarkdownConfig` is disabled.
