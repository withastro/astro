---
'astro': patch
---

Fix double-escaped ampersands in Markdown image `alt` and `title` attributes. The `__ASTRO_IMAGE_` round-trip now decodes the numeric (`&#x26;`) and named (`&amp;`) character references the Markdown processors emit, so an `&` in an alt or title is escaped exactly once in the final HTML instead of twice.
