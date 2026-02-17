---
'astro': minor
---

Adds support for responsive images when `security.csp` is enabled, out of the box. 

Astro's implementation of responsive image styles has been updated to be compatible with a configured Content Security Policy.

Instead of, injecting style elements at runtime, Astro will now generate your styles at build time using a combination of `class=""` and `data-*` attributes. This means that your processed styles are loaded and hashed out of the box by Astro.

If you were previously choosing between Astro's CSP feature and including responsive images on your site, you may now use them together.
