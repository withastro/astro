'@astrojs/language-server': patch
---

Fix completions in HTML attribute expressions like `href={value}` by deferring those positions to the TypeScript service.
