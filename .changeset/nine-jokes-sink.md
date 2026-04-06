---
'@astrojs/react': patch
---

Fix React 19 "Float" mechanism injecting <link rel="preload"> into Astro islands instead of the <head>. This PR adds a filter to @astrojs/react to strip these auto-generated resource from the island's HTML output, ensuring valid HTML structure.
