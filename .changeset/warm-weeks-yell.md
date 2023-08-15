---
"astro": major
---

`astro:assets` is now enabled by default and does not require `experimental.assets` to be enabled. In addition to the `astro:assets` module, this has two changes included by default:

- New ESM shape, importing an image will now return an object with different properties describing the image such as its path, format and dimensions.
- In Markdown, MDX, and Markdoc, images refered to using the `![]()` syntax will now properly be resolved no matter their position. This notably unlocks storing images next to your content.

