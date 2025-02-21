---
'@astrojs/mdx': minor
'@astrojs/internal-helpers': minor
'@astrojs/markdown-remark': minor
'astro': minor
---

Pass remote Markdown images through image service

Previously, Astro only allowed local images to be optimized when included using
`![]()` syntax in plain Markdown files. This was because, when the image
service was first introduced, it only was able to optimize those images. Now,
however, Astro's image service can optimize remote images as well. So, we can
add support for this!

This is a semver-minor bump because it can significantly change what's output
under certain circumstances.
