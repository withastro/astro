---
'astro': patch
---

Improves the developer experience of the custom `500.astro` page in development mode.

Before, in development, an error thrown during the rendering phase would display the default error overlay, even when users had the `500.astro` page.

Now, the development server will display the `500.astro` and the original error is logged in the console.
