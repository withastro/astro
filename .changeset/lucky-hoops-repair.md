---
'astro': patch
---

Fixes dev toolbar app canvases discarding their content on every client-side navigation

`DevToolbarCanvas` rebuilt its shadow root in `connectedCallback`, and a client-side navigation re-appends the toolbar into the swapped body, which reconnects every canvas. Because `initApp()` is guarded by `hasBeenInitialized`, `app.init()` never ran again, so a dev toolbar app's UI was destroyed on the first navigation and stayed gone until a full reload. The style is now written once in the constructor.
