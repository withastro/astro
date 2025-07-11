---
'astro': patch
---

Add support for the `avis` brand (AVIF sequence) in HEIF images.
This expands image import capabilities in the `/src` directory by recognizing AVIF sequences (.avif) embedded within HEIF containers. Users can now use animated `.avif` images without encountering a `NoImageMetadataError`.
