---
'astro': patch
---

Improves performance of static asset generation by fixing a bug that caused image transforms to be performed serially. This fix ensures that processing uses all CPUs when running in a multi-core environment.
