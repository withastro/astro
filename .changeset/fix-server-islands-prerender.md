---
'astro': patch
---

Fixes server islands (`server:defer`) not working when only used in prerendered pages with `output: 'server'`. The server island manifest was empty because the SSR environment built before the prerender environment, so components were not yet discovered. The build order is now prerender-first to ensure all server island components are registered in the manifest.
