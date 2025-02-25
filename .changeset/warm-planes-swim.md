---
'@astrojs/markdown-remark': minor
---

Transform remote images in addition to local images

Previously, an internal remark plugin only looked for images in `![]()` syntax
that referred to a relative path, passing through to an internal rehype plugin
that would transform them for later processing by Astro's image service.

Now, the plugins transform both local and remote images, outputting them into
`localImagePaths` and `remoteImagePaths` metadata fields. A new configuration
option, mirroring the one used by Astro, can be provided to control which
remote images get processed this way.
