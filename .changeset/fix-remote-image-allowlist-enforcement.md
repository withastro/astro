---
'astro': patch
---

Throws `RemoteImageNotAllowed` error when using `<Image>` or `getImage()` with a remote URL whose domain is not in the configured `image.domains` or `image.remotePatterns`. Previously, non-allowed remote images were silently passed through without optimization or any warning. The allowlist check now applies to all remote images, not just those using `inferSize`.
