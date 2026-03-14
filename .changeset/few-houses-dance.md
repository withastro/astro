---
'@astrojs/preact': patch
---

Fix `useId()` collisions across multiple Astro islands by seeding a unique per-island root mask for Preact SSR and hydration.
