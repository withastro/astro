---
'astro': patch
---

Fixes an issue where editing a client-side component (e.g. with `client:idle`, `client:load`, etc.) caused an unnecessary full program reload of the backend during development. The `astro:hmr-reload` plugin now correctly returns an empty array when all changed modules are found in the client module graph, preventing Vite's default SSR HMR propagation from triggering a full reload. This was a regression from Astro v5 where client-side component edits only triggered client-side HMR without affecting the server.
