---
'astro': patch
---

Adds `.ico` favicon fallbacks to all examples to ensure correct indexing in Google Search results

Updated official examples to include favicon.ico in the `public/` directory alongside existing SVGs. While SVG icons work in modern browsers, Google's search crawler often requires a standard `.ico` file to display site icons correctly in search results. This change adds the necessary `favicon.ico` and `<link rel="icon" type="image/x-icon" href="/favicon.ico" />` tags to ensure better visibility and cross-browser compatibility.