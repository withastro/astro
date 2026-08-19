---
'astro': patch
---

Fixes `Astro.preferredLocale` and `Astro.preferredLocaleList` ignoring `Accept-Language` quality values when they are absent or `0`. An entry without an explicit `q=` now correctly counts as quality `1.0` (per RFC 7231) and an entry with `q=0` is treated as not acceptable, so the highest-quality locale is selected regardless of header order.
