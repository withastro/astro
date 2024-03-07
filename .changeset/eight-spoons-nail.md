---
"astro": patch
---

Fixes a regression where full dynamic routes were prioritized over partial dynamic routes. Now a route like `food-[name].astro` is matched **before** `[name].astro`.
