---
'astro': minor
---

Improved performance of optimized images generation at build time. Astro will now generate optimized images concurrently, which can significantly speed up build times for sites with many images. Additionally, Astro will now reuse the same buffer for all variants of an image, which should improve performance for sites websites with many variants of the same image, especially when using remote images.

No code changes are required to take advantage of these improvements.
