---
'astro': patch
---

Improved error handling in the rendering phase

Added defensive validation in `App.render()` and `#renderError()` to provide a descriptive error message when a route module doesn't have a valid page function.
