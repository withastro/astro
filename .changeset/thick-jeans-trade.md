---
'@astrojs/mdx': minor
'@astrojs/markdown-remark': minor
'astro': minor
---

Optimize remote images in Markdown files

Previously, Astro only allowed local images to be optimized when included using `![]()` syntax in plain Markdown files. This was because, when the image service was first introduced, it only was able to optimize those images. Now, however, Astro's image service can optimize remote images as well. So, we can add support for this now!