---
'astro': major
---

Fixed an issue where modifying the `Request.headers` prototype during prerendering caused a build error. Removed conflicting value and writable properties from the `headers` descriptor to prevent `Invalid property descriptor` errors.
