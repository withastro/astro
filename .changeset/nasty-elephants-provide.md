---
'astro': minor
---

Updates the Image Services API to now delete original images from the final build that are not used outside of the optimization pipeline. For users with a large number of these images (e.g. thumbnails), this should reduce storage consumption and deployment times.
