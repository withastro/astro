---
'astro': patch
---

Fixes an issue where visiting an invalid locale URL (e.g. `/asdf/`) would show the content of a dynamic `[locale]` page with a 404 status code, instead of showing your custom 404 page. Now, the correct 404 page is rendered when the locale in the URL doesn't match any configured locale.
