---
"astro": major
---

`astro:assets` is now enabled by default. If you were previously using the `experimental.assets` flag, please remove it from your config. Also note that the previous `@astrojs/image` integration is incompatible, and must be removed.

This also brings two important changes to using images in Astro:

- New ESM shape: importing an image will now return an object with different properties describing the image such as its path, format and dimensions. This is a breaking change and may require you to update your existing images.
- In Markdown, MDX, and Markdoc, the `![]()` syntax will now resolve relative images located anywhere in your project in addition to remote images and images stored in the `public/` folder. This notably unlocks storing images next to your content.

Please see our existing [Assets page in Docs](https://docs.astro.build/en/guides/assets/) for more information about using `astro:assets`.

