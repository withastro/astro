---
"astro": patch
---

Fixes performance regression and OOM errors when building medium-sized blogs with many content entries. Replaced O(n²) object spread pattern with direct mutation in `generateLookupMap`.
