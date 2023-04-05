---
'astro': patch
---

Better errors for when response is already sent

This adds clearer error messaging when a Response has already been sent to the browser and the developer attempts to use:

- Astro.cookies.set
- Astro.redirect
