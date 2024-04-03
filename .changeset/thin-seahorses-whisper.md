---
"astro": patch
---

This change disables the `sharp` `libvips` image cache as it errors when the
file is too small and operations are happening too fast (runs into a race
condition)
