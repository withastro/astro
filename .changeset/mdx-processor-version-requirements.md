---
'@astrojs/mdx': major
---

Moves MDX file processing to the Markdown processors.

'@astrojs/mdx' is still required to add MDX support to your project. However, it now delegates the MDX files processing to Markdown processors.

#### What should I do?

If you haven't explicitly installed a Markdown processor, you don't need to do anything.

Otherwise, ensure that your configured Markdown processor uses the following version:
- `@astrojs/markdown-satteri` 0.4.0 or later if you use `satteri()`
- `@astrojs/markdown-remark` 7.3.0 or later if you use `unified()`
