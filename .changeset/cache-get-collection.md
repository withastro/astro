---
'astro': patch
---

Caches `getCollection()` results to avoid redundant image reference traversals on repeated calls. Previously, every call to `getCollection()` re-iterated all entries and ran `structuredClone` + recursive traversal on each entry's data to resolve image references, even though the underlying data store is immutable at runtime. This caused O(N×M) scaling (N pages × M entries) that became a severe bottleneck for sites with large content collections. The fix restores the caching behavior that existed before the Content Layer refactor.
