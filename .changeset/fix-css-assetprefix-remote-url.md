---
'astro': patch
---

Fixes CSS `assetsPrefix` with remote URLs incorrectly prepending a forward slash

When using `build.assetsPrefix` with a remote URL (e.g., `https://cdn.example.com`) for CSS assets, the generated `<link>` elements were incorrectly getting a `/` prepended to the full URL, resulting in invalid URLs like `/https://cdn.example.com/assets/style.css`.

This fix checks if the stylesheet link is a remote URL before prepending the forward slash.
