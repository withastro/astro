---
'astro': patch
---

Adds `.ico` favicon fallbacks to all examples to ensure correct indexing in Google Search results

Previously, some official examples used only SVG favicons. While supported by modern browsers, this caused issues with Google Search's crawler, which may fail to display favicons for sites without a standard `.ico` fallback. This change adds a `favicon.ico` file to the `public/` directory and includes an explicit `<link rel="icon" href="/favicon.ico" />` tag to improve cross-browser and crawler compatibility.
