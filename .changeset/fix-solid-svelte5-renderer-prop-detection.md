---
'@astrojs/solid-js': patch
---

Fix `@astrojs/solid-js` incorrectly claiming Svelte 5 components compiled with the newer `$$renderer` prop (instead of the legacy `$$payload`). Projects mixing Solid and Svelte could see Svelte components silently rendered as empty strings by the Solid renderer.
