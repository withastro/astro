---
'@astrojs/vue': patch
---

Prevents Astro from crashing when no default function is exported from the `appEntrypoint`. Now, the entrypoint will be ignored with a warning instead.
