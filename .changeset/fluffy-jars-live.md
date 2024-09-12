---
'astro': major
---

Removes the `assets` property on `supportedAstroFeatures` for adapters, as it did not reflect reality properly in many cases.

Now, relating to assets, only a single `sharpImageService` property is available, determining if the adapter is compatible with the built-in sharp image service.
