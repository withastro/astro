---
'astro': patch
---

Removes inline CSS for prerendered routes from the SSR manifest. The static HTML on disk already inlines those styles, and the SSR worker never renders prerendered routes, so the data was dead weight. Builds with many prerendered routes and `build.inlineStylesheets: "always"` (or `"auto"` with small stylesheets) will see a smaller SSR entry chunk, which reduces cold-start parse time on platforms like Cloudflare Workers.
