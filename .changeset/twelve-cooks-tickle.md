---
'astro': minor
---

Fixed a problem in which trailing slashes were automatically inserted for URLs set as 'site' key in astro.config.
Implementers should be aware that, for example, setting `${import.meta.env.SITE}ogp.png` to load an OGP will be converted to `https://example.comogp.png` and the image will not be loaded. As a result, the image may not load.

## What should consumer do?
Consumer should search `import.meta.env.SITE` when raising to this version and change it if they are writing code that expects the trailing slash to be added automatically.
