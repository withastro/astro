---
'@astrojs/netlify': minor
---

Updates adapter to receive `buildOutput` from the `astro:build:done` hook instead of `astro:config:done`. This ensures the adapter correctly handles server islands in static sites.
