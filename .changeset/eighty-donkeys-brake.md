---
'astro': patch
---

Fixes duplicate CSS files being emitted in server output when a prerendered page and a server-rendered page share the same styles (e.g. a shared layout importing Tailwind). The prerender and SSR environments each emitted their own copy of the same stylesheet (`index.X.css` and `_..Y.css`); the SSR build now reuses the CSS asset filename from the prerender build when the stylesheet is backed by the same CSS source modules, so only a single file is emitted.
