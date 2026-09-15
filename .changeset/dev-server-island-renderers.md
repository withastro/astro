---
'astro': patch
---

Fixes server islands failing to render framework components in the dev server when the island request does not share a manifest with a page render.

In dev, renderers were only loaded when a non-built-in route was rendered, so a request to `/_server-islands/[name]` that arrived with a fresh manifest object had no renderers available and any framework component inside the island failed with `NoMatchingRenderer`. This happened with a custom `src/fetch.ts` handler built on `astro/fetch`, where the ambient manifest module is re-evaluated after each `.astro` transform, and was most visible in Safari because it requests islands after the page has loaded rather than during the render. Renderers are now loaded before the built-in route check so island requests always have them.
