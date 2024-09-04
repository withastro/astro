---
'astro': patch
---

Exports types for all `LoaderContext` properties from `astro/loaders` to make it easier to use them in custom loaders.
The `ScopedDataStore` interface (which was previously internal) is renamed to `DataStore`, to reflect the fact that it's the only public API for the data store. 
