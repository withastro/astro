---
'astro': minor
---

Refactors the internal module resolution system to use a new caching strategy. Updated the `ModuleLoader` class to implement a LRU cache and modified the import graph traversal algorithm for better performance.
