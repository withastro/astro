---
'@astrojs/markdown-remark': minor
---

Adds remote image optimization in Markdown

Previously, an internal remark plugin only looked for images in `![]()` syntax that referred to a relative file path. This meant that only local images stored in `src/` were passed through to an internal rehype plugin that would transform them for later processing by Astro's image service.

Now, the plugins recognize and transform both local and remote images using this syntax.

While not configurable at this time, this process outputs two separate metadata fields (`localImagePaths` and `remoteImagePaths`) which allow for the possibility of controlling the behavior of each type of image separately in the future.
