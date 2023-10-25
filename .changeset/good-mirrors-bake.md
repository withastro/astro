---
'astro': minor
---

Improved image optimization performance

Astro will now generate optimized images concurrently at build time, which can significantly speed up build times for sites with many images. Additionally, Astro will now reuse the same buffer for all variants of an image. This should improve performance for websites with many variants of the same image, especially when using remote images.

No code changes are required to take advantage of these improvements.
