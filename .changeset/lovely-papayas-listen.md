---
'astro': patch
---

Fixes intermittent `ImageNotFound` errors during build on projects with many images. The build now limits concurrent image file reads to avoid exhausting OS file descriptors (EMFILE) and retries transient I/O errors with backoff. Non-transient errors are no longer silently swallowed.
