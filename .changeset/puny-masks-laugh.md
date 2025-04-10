---
'astro': major
---

Fix routing with base paths when trailingSlash is set to 'never'. This ensures requests to '/base' are correctly matched when the base path is set to '/base', without requiring a trailing slash.
